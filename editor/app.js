import { createApp } from '/vendor/vue.esm-browser.js';

createApp({
  data() {
    return {
      busy: false,
      categories: [],
      departments: [],
      departmentFilter: '',
      lastAction: null,
      manifest: null,
      products: [],
      query: '',
      saveError: '',
      selectedProduct: null,
      selectedSku: '',
    };
  },
  computed: {
    actionOutput() {
      if (!this.lastAction) return '';
      return [this.lastAction.stdout, this.lastAction.stderr].filter(Boolean).join('\n').trim();
    },
    filteredProducts() {
      const terms = this.query.trim().toLowerCase().split(/\s+/).filter(Boolean);

      return this.products.filter((product) => {
        if (this.departmentFilter && product.departmentId !== this.departmentFilter) return false;
        if (terms.length === 0) return true;

        const haystack = `${product.name} ${product.sku}`.toLowerCase();
        return terms.every((term) => haystack.includes(term));
      });
    },
  },
  async mounted() {
    const response = await fetch('/api/catalog');
    const catalog = await response.json();

    this.manifest = catalog.manifest;
    this.categories = catalog.categories;
    this.departments = catalog.departments;
    this.products = catalog.products;

    if (this.products.length > 0) await this.selectProduct(this.products[0].sku);
  },
  methods: {
    departmentLabel(departmentId) {
      return this.departments.find((department) => department.id === departmentId)?.label || departmentId;
    },
    async runAction(title, url) {
      this.busy = true;
      this.lastAction = { title, ok: true, stdout: 'Running...', stderr: '' };

      try {
        const response = await fetch(url, { method: 'POST' });
        this.lastAction = { title, ...(await response.json()) };
      } catch (error) {
        this.lastAction = { title, ok: false, stdout: '', stderr: error instanceof Error ? error.message : String(error) };
      } finally {
        this.busy = false;
      }
    },
    async rebuildSearchIndex() {
      await this.runAction('Rebuild Search Index', '/api/actions/rebuild-search-index');
    },
    async runValidation() {
      await this.runAction('Validate Data', '/api/actions/validate');
    },
    async selectProduct(sku) {
      this.selectedSku = sku;
      this.saveError = '';
      const response = await fetch(`/api/products/${encodeURIComponent(sku)}`);
      this.selectedProduct = await response.json();
      await this.updatePreview();
    },
    async saveProduct() {
      if (!this.selectedProduct?.product) return;

      this.busy = true;
      this.saveError = '';

      try {
        const response = await fetch(`/api/products/${encodeURIComponent(this.selectedProduct.sku)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product: this.selectedProduct.product, bumpVersion: true }),
        });
        const result = await response.json();

        if (!response.ok) {
          this.saveError = result.validationErrors
            ? result.validationErrors.map((error) => `${error.path}: ${error.message}`).join('\n')
            : result.error || 'Save failed';
          return;
        }

        this.manifest = result.manifest;
        this.selectedProduct = result.product;
        const index = this.products.findIndex((product) => product.sku === result.product.sku);
        if (index !== -1) this.products.splice(index, 1, result.product);
        this.lastAction = {
          title: 'Save Product',
          ok: true,
          stdout: `Saved ${result.product.sku} to ${result.file}; catalog version is now ${result.manifest.catalogVersion}.`,
          stderr: '',
        };
      } catch (error) {
        this.saveError = error instanceof Error ? error.message : String(error);
      } finally {
        this.busy = false;
      }
    },
    async updatePreview() {
      if (!this.selectedProduct?.product) return;

      const response = await fetch('/api/preview/markdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown: this.selectedProduct.product.description || '' }),
      });
      const result = await response.json();
      this.selectedProduct.renderedDescription = result.html;
    },
  },
}).mount('#app');
