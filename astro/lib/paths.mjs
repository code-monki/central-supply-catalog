export const basePath = import.meta.env.BASE_URL || '/';

export const withBase = (targetPath) => {
  if (!targetPath || /^(?:[a-z]+:)?\/\//i.test(targetPath) || targetPath.startsWith('#')) {
    return targetPath;
  }

  const base = basePath.endsWith('/') ? basePath : `${basePath}/`;
  if (targetPath === '/') return base;

  return `${base}${targetPath.replace(/^\/+/, '')}`;
};

export const withBaseHtml = (html) => {
  if (!html) return '';
  const base = basePath.endsWith('/') ? basePath : `${basePath}/`;
  return html.replace(/\b(href|src)="\/(?!\/)/g, `$1="${base}`);
};
