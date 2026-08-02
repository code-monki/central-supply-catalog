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
      const response = await fetch(`/api/products/${encodeURIComponent(sku)}`);
      this.selectedProduct = await response.json();
    },
  },
}).mount('#app');
