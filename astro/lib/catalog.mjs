import fs from 'node:fs';
import path from 'node:path';
import MarkdownIt from 'markdown-it';
import slugify from 'slugify';

const rootDir = process.cwd();
const md = new MarkdownIt({ html: true });

const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(rootDir, relativePath), 'utf8'));
const asArray = (value) => (Array.isArray(value) ? value : [value]);

export const manufacturers = readJson('astro/data/manufacturers.json');
export const categories = readJson('astro/data/categories.json');
export const departments = readJson('astro/data/departments.json');
export const publishers = readJson('astro/data/publishers.json');

export const slug = (value) => slugify(value, { lower: true, strict: true });

export const costLabel = (cost) => {
  let unitLabel = 'Cr';
  let modValue = Number(cost) || 0;

  if (cost > 999999999999) {
    modValue = cost / 10 ** 12;
    unitLabel = 'TCr';
  } else if (cost > 999999999) {
    modValue = cost / 10 ** 9;
    unitLabel = 'BCr';
  } else if (cost > 999999) {
    modValue = cost / 10 ** 6;
    unitLabel = 'MCr';
  } else if (cost > 999) {
    modValue = cost / 10 ** 3;
    unitLabel = 'KCr';
  }

  const displayValue = modValue - Math.floor(modValue) !== 0 ? modValue.toFixed(3) : Math.trunc(modValue);
  return `${displayValue} ${unitLabel}`;
};

export const convertTL = (techLevel) => {
  const tl = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  return tl[techLevel] || '';
};

export const renderMarkdown = (content = '') => md.render(content);

export const readMarkdownPage = (relativePath) => {
  const source = fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
  const match = source.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);

  if (!match) {
    return {
      data: {},
      html: renderMarkdown(source),
    };
  }

  const data = {};
  for (const line of match[1].split('\n')) {
    const separator = line.indexOf(':');
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
    data[key] = value;
  }

  return {
    data,
    html: renderMarkdown(match[2]),
  };
};

export const extractSummary = (text = '') => {
  const separatorsList = [
    { start: '<!-- Summary Start -->', end: '<!-- Summary End -->' },
    { start: '<p>', end: '</p>' },
  ];

  for (const separators of separatorsList) {
    const startPosition = text.indexOf(separators.start);
    const endPosition = text.indexOf(separators.end);

    if (startPosition !== -1 && endPosition !== -1) {
      return text.substring(startPosition + separators.start.length, endPosition).trim();
    }
  }

  return null;
};

let productCache = null;
let productRecordCache = null;

export const allProductRecords = () => {
  if (productRecordCache) return productRecordCache;

  const productsDir = path.join(rootDir, 'src/_data/products');
  const categoryDirs = fs.readdirSync(productsDir);

  productRecordCache = categoryDirs
    .flatMap((category) => {
      const categoryDir = path.join(productsDir, category);
      return fs
        .readdirSync(categoryDir)
        .filter((file) => path.extname(file) === '.json')
        .flatMap((file) => asArray(JSON.parse(fs.readFileSync(path.join(categoryDir, file), 'utf8'))).map((product) => ({
          ...product,
          category,
        })));
    })
    .sort((a, b) => (a.name || a.sku).localeCompare(b.name || b.sku));

  return productRecordCache;
};

export const allProducts = () => {
  if (productCache) return productCache;

  productCache = allProductRecords()
    .filter((product) => product.name && !product.sku.match(/-00000$/g))
    .sort((a, b) => a.name.localeCompare(b.name));

  return productCache;
};

export const getProduct = (sku) => allProducts().find((product) => product.sku === sku) || null;

export const getProductsForDepartment = (departmentId) => {
  const department = departments.find((item) => item.id === departmentId);
  if (!department) return [];

  const expectedDir = path.join(rootDir, department.datadir);
  const fallbackDir = path.join(rootDir, 'src/_data/products', slug(department.label));
  const dir = fs.existsSync(expectedDir) ? expectedDir : fallbackDir;
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((file) => path.extname(file) === '.json')
    .flatMap((file) => asArray(JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'))))
    .filter((product) => !product.sku.match(/-00000$/g))
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const getProductsForCategory = (categoryLabel) => {
  const category = categories.find((item) => item.label === categoryLabel);
  if (!category) return [];

  if (category.departments.length === 0) {
    const department = departments.find((item) => item.label === category.label);
    return department ? getProductsForDepartment(department.id) : [];
  }

  return category.departments
    .flatMap((departmentId) => getProductsForDepartment(departmentId))
    .filter((product) => product.name && !product.sku.match(/-00000$/g))
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const departmentPages = () => {
  const pages = new Map();

  for (const category of categories) {
    pages.set(slug(category.label), {
      label: category.label,
      products: getProductsForCategory(category.label),
    });

    for (const departmentId of category.departments) {
      const department = departments.find((item) => item.id === departmentId);
      if (department) {
        pages.set(slug(department.label), {
          label: department.label,
          products: getProductsForDepartment(department.id),
        });
      }
    }
  }

  return [...pages.entries()].map(([pageSlug, page]) => ({
    slug: pageSlug,
    ...page,
  }));
};

export const searchDocuments = () =>
  allProducts().map((product) => ({
    sku: product.sku,
    name: product.name,
    description: product.description || '',
    summary: extractSummary(renderMarkdown(product.description || '')) || '',
    cost: product.cost,
    image: productImagePath(product),
  }));

let indexVersion = null;

export const searchIndexVersion = () => {
  if (indexVersion) return indexVersion;

  const serviceWorker = fs.readFileSync(path.join(rootDir, 'src/sw.js'), 'utf8');
  const match = serviceWorker.match(/const\s+version\s*=\s*['"]?([^;'"]+)/);
  indexVersion = match ? match[1].trim() : '1';
  return indexVersion;
};

export const productImagePath = (product) => {
  if (product.image) {
    if (!product.image.startsWith('/img/')) return product.image;

    const requestedPath = path.join(rootDir, 'src', product.image);
    if (fs.existsSync(requestedPath)) return product.image;
  }

  const skuPath = `/img/products/${product.sku}.png`;
  if (fs.existsSync(path.join(rootDir, 'src', skuPath))) return skuPath;

  return '';
};

export const getManufacturer = (mfrId) => manufacturers.find((item) => item.mfrId === mfrId) || null;

export const getPublisher = (publisherName) => publishers.find((item) => item.name === publisherName) || null;

export const departmentMenu = () =>
  [...categories]
    .sort((a, b) => a.label.localeCompare(b.label))
    .map((category) => ({
      label: category.label,
      href: `/departments/${slug(category.label)}`,
      departments: category.departments
        .map((id) => departments.find((department) => department.id === id))
        .filter(Boolean)
        .sort((a, b) => a.label.localeCompare(b.label))
        .map((department) => ({
          label: department.label,
          href: `/departments/${slug(department.label)}`,
        })),
    }));
