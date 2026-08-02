import fs from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import slugify from 'slugify';

const rootDir = process.cwd();
const resolvePath = (relativePath) => path.join(rootDir, relativePath);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(resolvePath(relativePath), 'utf8'));
const asArray = (value) => (Array.isArray(value) ? value : [value]);
const slug = (value) => slugify(value, { lower: true, strict: true });
const displayPath = (filePath) => path.relative(rootDir, filePath);

const ajv = new Ajv2020({ allErrors: true, strict: false });

const productSchema = readJson('schemas/product.schema.json');
const manifestSchema = readJson('schemas/catalog-manifest.schema.json');
const metadataSchema = readJson('schemas/catalog-metadata.schema.json');

ajv.addSchema(metadataSchema);

const validators = {
  product: ajv.compile(productSchema),
  manifest: ajv.compile(manifestSchema),
  categories: ajv.compile({ type: 'array', items: { $ref: `${metadataSchema.$id}#/definitions/category` } }),
  departments: ajv.compile({ type: 'array', items: { $ref: `${metadataSchema.$id}#/definitions/department` } }),
  manufacturers: ajv.compile({ type: 'array', items: { $ref: `${metadataSchema.$id}#/definitions/manufacturer` } }),
  publishers: ajv.compile({ type: 'array', items: { $ref: `${metadataSchema.$id}#/definitions/publisher` } }),
  attributions: ajv.compile({ type: 'array', items: { $ref: `${metadataSchema.$id}#/definitions/attribution` } }),
};

const errors = [];
const warnings = [];

const pushSchemaErrors = (label, validate) => {
  for (const error of validate.errors || []) {
    errors.push(`${label}${error.instancePath || ''}: ${error.message}`);
  }
};

const validateSchema = (label, validate, value) => {
  if (!validate(value)) pushSchemaErrors(label, validate);
};

const validateUnique = (label, items, key) => {
  const seen = new Set();

  for (const item of items) {
    const value = item[key];
    if (!value) continue;

    if (seen.has(value)) {
      errors.push(`${label}: duplicate ${key} "${value}"`);
    } else {
      seen.add(value);
    }
  }
};

const manifest = readJson('astro/data/catalog-manifest.json');
const categories = readJson('astro/data/categories.json');
const departments = readJson('astro/data/departments.json');
const manufacturers = readJson('astro/data/manufacturers.json');
const publishers = readJson('astro/data/publishers.json');
const attributions = readJson('astro/data/attributions.json');

validateSchema('astro/data/catalog-manifest.json', validators.manifest, manifest);
validateSchema('astro/data/categories.json', validators.categories, categories);
validateSchema('astro/data/departments.json', validators.departments, departments);
validateSchema('astro/data/manufacturers.json', validators.manufacturers, manufacturers);
validateSchema('astro/data/publishers.json', validators.publishers, publishers);
validateSchema('astro/data/attributions.json', validators.attributions, attributions);

validateUnique('departments', departments, 'id');
validateUnique('manufacturers', manufacturers, 'mfrId');
validateUnique('publishers', publishers, 'name');
validateUnique('attributions', attributions, 'publication');

const departmentsById = new Map(departments.map((department) => [department.id, department]));
const departmentIds = new Set(departmentsById.keys());

for (const category of categories) {
  for (const departmentId of category.departments || []) {
    if (!departmentIds.has(departmentId)) {
      errors.push(`astro/data/categories.json: category "${category.label}" references unknown department "${departmentId}"`);
    }
  }
}

const resolveDepartmentDir = (department) => {
  const configuredDir = resolvePath(department.datadir);
  if (fs.existsSync(configuredDir)) return configuredDir;
  return resolvePath(path.join('src/_data/products', slug(department.label)));
};

const productRoot = resolvePath('src/_data/products');
const productFiles = [];

for (const dirName of fs.readdirSync(productRoot).sort()) {
  const dirPath = path.join(productRoot, dirName);
  if (!fs.statSync(dirPath).isDirectory()) continue;

  for (const fileName of fs.readdirSync(dirPath).filter((item) => item.endsWith('.json')).sort()) {
    productFiles.push(path.join(dirPath, fileName));
  }
}

const products = [];
const skuSources = new Map();

for (const productFile of productFiles) {
  const parsed = JSON.parse(fs.readFileSync(productFile, 'utf8'));

  if (Array.isArray(parsed)) {
    errors.push(`${displayPath(productFile)}: product files must contain one product object, not an array`);
  }

  for (const product of asArray(parsed)) {
    validateSchema(`${displayPath(productFile)} (${product.sku || 'unknown sku'})`, validators.product, product);

    if (!product.sku) continue;

    const skuFileName = `${product.sku}.json`;
    if (path.basename(productFile) !== skuFileName) {
      errors.push(`${displayPath(productFile)}: file name must be ${skuFileName}`);
    }

    const departmentId = product.sku.split('-').slice(0, 2).join('-');
    const department = departmentsById.get(departmentId);
    if (!department) {
      errors.push(`${displayPath(productFile)}: SKU ${product.sku} references unknown department ${departmentId}`);
    } else {
      const expectedDir = resolveDepartmentDir(department);
      if (path.resolve(path.dirname(productFile)) !== path.resolve(expectedDir)) {
        errors.push(
          `${displayPath(productFile)}: SKU ${product.sku} belongs in ${displayPath(expectedDir)} based on department ${departmentId}`
        );
      }
    }

    if (skuSources.has(product.sku)) {
      errors.push(`${displayPath(productFile)}: duplicate SKU ${product.sku}; first seen in ${skuSources.get(product.sku)}`);
    } else {
      skuSources.set(product.sku, displayPath(productFile));
    }

    products.push({ file: productFile, product });
  }
}

const productSkus = new Set(products.map(({ product }) => product.sku).filter(Boolean));

for (const { file, product } of products) {
  for (const accessorySku of product.accessories || []) {
    if (!productSkus.has(accessorySku)) {
      errors.push(`${displayPath(file)}: accessory ${accessorySku} does not reference an existing product`);
    }
  }

  for (const variant of product.variants || []) {
    if (!productSkus.has(variant.sku)) {
      errors.push(`${displayPath(file)}: variant ${variant.sku} does not reference an existing product`);
    }
  }

  if (product.image?.startsWith('/img/')) {
    const imagePath = resolvePath(path.join('src', product.image));
    if (!fs.existsSync(imagePath)) {
      warnings.push(`${displayPath(file)}: image ${product.image} does not exist under src/`);
    }
  }
}

if (warnings.length > 0) {
  console.warn(`Catalog data validation warnings (${warnings.length}):`);
  for (const warning of warnings) console.warn(`  - ${warning}`);
}

if (errors.length > 0) {
  console.error(`Catalog data validation failed (${errors.length}):`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(`Catalog data validation passed: ${products.length} products, ${departments.length} departments, version ${manifest.catalogVersion}.`);
