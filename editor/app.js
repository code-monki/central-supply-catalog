import { createApp } from '/vendor/vue.esm-browser.js';

createApp({
  data() {
    return {
      busy: false,
      categories: [],
      createDepartmentLabel: '',
      createError: '',
      createSubdepartmentId: '',
      createTargetFile: '',
      departments: [],
      departmentFilter: '',
      lastAction: null,
      manifest: null,
      mode: 'edit',
      navigation: [],
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
    selectedNavigationDepartment() {
      return this.navigation.find((department) => department.label === this.createDepartmentLabel) || null;
    },
    selectableSubdepartments() {
      return this.selectedNavigationDepartment?.subdepartments || [];
    },
  },
  async mounted() {
    const response = await fetch('/api/catalog');
    const catalog = await response.json();

    this.manifest = catalog.manifest;
    this.categories = catalog.categories;
    this.departments = catalog.departments;
    this.navigation = catalog.navigation;
    this.products = catalog.products;
    this.createDepartmentLabel = this.navigation[0]?.label || '';
    this.createSubdepartmentId = this.selectableSubdepartments[0]?.id || '';

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
      this.mode = 'edit';
      this.selectedSku = sku;
      this.saveError = '';
      this.createError = '';
      const response = await fetch(`/api/products/${encodeURIComponent(sku)}`);
      this.selectedProduct = await response.json();
      await this.updatePreview();
    },
    async startCreateProduct() {
      if (!this.createSubdepartmentId) return;

      this.busy = true;
      this.saveError = '';
      this.createError = '';

      try {
        const response = await fetch(`/api/departments/${encodeURIComponent(this.createSubdepartmentId)}/next-sku`);
        const allocation = await response.json();

        if (!response.ok) {
          this.createError = allocation.error || 'Could not allocate SKU';
          return;
        }

        this.mode = 'create';
        this.selectedSku = allocation.sku;
        this.createTargetFile = allocation.file;
        this.selectedProduct = {
          sku: allocation.sku,
          name: allocation.product.name,
          cost: allocation.product.cost,
          departmentId: this.createSubdepartmentId,
          image: allocation.product.image,
          description: allocation.product.description,
          renderedDescription: '',
          product: allocation.product,
        };
        await this.updatePreview();
      } catch (error) {
        this.createError = error instanceof Error ? error.message : String(error);
      } finally {
        this.busy = false;
      }
    },
    async saveProduct() {
      if (!this.selectedProduct?.product) return;

      this.busy = true;
      this.saveError = '';

      try {
        const response = await fetch(this.mode === 'create' ? '/api/products' : `/api/products/${encodeURIComponent(this.selectedProduct.sku)}`, {
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
        if (index === -1) {
          this.products.push(result.product);
          this.products.sort((a, b) => a.name.localeCompare(b.name));
        } else {
          this.products.splice(index, 1, result.product);
        }
        this.mode = 'edit';
        this.createTargetFile = '';
        this.lastAction = {
          title: index === -1 ? 'Create Product' : 'Save Product',
          ok: true,
          stdout: `${index === -1 ? 'Created' : 'Saved'} ${result.product.sku} at ${result.file}; catalog version is now ${result.manifest.catalogVersion}.`,
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
