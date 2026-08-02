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
      git: null,
      gitDiff: '',
      commitMessage: '',
      taxonomyCategoryLabel: '',
      categoryDraftLabel: '',
      newCategoryLabel: '',
      taxonomySubdepartmentId: '',
      subdepartmentDraft: null,
      newSubdepartment: {
        id: '',
        label: '',
        shortLabel: '',
        description: '',
        datadir: '',
      },
      taxonomyError: '',
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
    taxonomyCategory() {
      return this.categories.find((category) => category.label === this.taxonomyCategoryLabel) || null;
    },
    taxonomySubdepartments() {
      if (!this.taxonomyCategory) return [];
      const ids = new Set(this.taxonomyCategory.departments || []);
      if (ids.size === 0) return this.departments.filter((department) => department.label === this.taxonomyCategory.label);
      return this.departments.filter((department) => ids.has(department.id));
    },
  },
  async mounted() {
    const response = await fetch('/api/catalog');
    const catalog = await response.json();

    this.applyCatalog(catalog);
    await this.refreshGitStatus();
    if (this.products.length > 0) await this.selectProduct(this.products[0].sku);
  },
  methods: {
    applyCatalog(catalog) {
      this.manifest = catalog.manifest;
      this.categories = catalog.categories;
      this.departments = catalog.departments;
      this.navigation = catalog.navigation;
      this.products = catalog.products;
      this.createDepartmentLabel ||= this.navigation[0]?.label || '';
      this.createSubdepartmentId ||= this.selectableSubdepartments[0]?.id || '';
      this.taxonomyCategoryLabel ||= this.categories[0]?.label || '';
      this.categoryDraftLabel = this.taxonomyCategoryLabel;
      this.selectTaxonomySubdepartment(this.taxonomySubdepartments[0]?.id || '');
    },
    departmentLabel(departmentId) {
      return this.departments.find((department) => department.id === departmentId)?.label || departmentId;
    },
    datadirForLabel(label) {
      const slug = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return slug ? `src/_data/products/${slug}` : '';
    },
    async refreshTaxonomy() {
      const response = await fetch('/api/taxonomy');
      const taxonomy = await response.json();
      this.categories = taxonomy.categories;
      this.departments = taxonomy.departments;
      this.navigation = taxonomy.navigation;
      if (!this.categories.some((category) => category.label === this.taxonomyCategoryLabel)) {
        this.taxonomyCategoryLabel = this.categories[0]?.label || '';
      }
      this.categoryDraftLabel = this.taxonomyCategoryLabel;
      this.selectTaxonomySubdepartment(this.taxonomySubdepartmentId || this.taxonomySubdepartments[0]?.id || '');
    },
    selectTaxonomyCategory() {
      this.categoryDraftLabel = this.taxonomyCategoryLabel;
      this.taxonomyError = '';
      this.selectTaxonomySubdepartment(this.taxonomySubdepartments[0]?.id || '');
    },
    selectTaxonomySubdepartment(departmentId) {
      this.taxonomySubdepartmentId = departmentId || '';
      const department = this.departments.find((item) => item.id === this.taxonomySubdepartmentId);
      this.subdepartmentDraft = department ? { ...department, shortLabel: department.shortLabel || department.shortlabel || '' } : null;
    },
    async createCategory() {
      const label = this.newCategoryLabel.trim();
      if (!label) return;

      const saved = await this.saveTaxonomyRequest('Create Department', '/api/categories', {
        category: { label, departments: [] },
      });
      if (saved) {
        this.newCategoryLabel = '';
        this.taxonomyCategoryLabel = label;
        this.categoryDraftLabel = label;
      }
    },
    async saveCategory() {
      if (!this.taxonomyCategory) return;
      const originalLabel = this.taxonomyCategory.label;
      const nextLabel = this.categoryDraftLabel.trim();
      const saved = await this.saveTaxonomyRequest('Save Department', `/api/categories/${encodeURIComponent(originalLabel)}`, {
        category: { label: nextLabel, departments: this.taxonomyCategory.departments },
      });
      if (saved) {
        this.taxonomyCategoryLabel = nextLabel;
        this.categoryDraftLabel = nextLabel;
      }
    },
    updateNewSubdepartmentDatadir() {
      if (!this.newSubdepartment.datadir) this.newSubdepartment.datadir = this.datadirForLabel(this.newSubdepartment.label);
    },
    async createSubdepartment() {
      const department = { ...this.newSubdepartment };
      if (!department.datadir) department.datadir = this.datadirForLabel(department.label);

      const saved = await this.saveTaxonomyRequest('Create Sub-department', '/api/departments', {
        categoryLabel: this.taxonomyCategoryLabel,
        department,
      });
      if (saved) {
        this.taxonomySubdepartmentId = department.id;
        this.selectTaxonomySubdepartment(department.id);
        this.newSubdepartment = { id: '', label: '', shortLabel: '', description: '', datadir: '' };
      }
    },
    async saveSubdepartment() {
      if (!this.subdepartmentDraft) return;
      await this.saveTaxonomyRequest('Save Sub-department', `/api/departments/${encodeURIComponent(this.subdepartmentDraft.id)}`, {
        categoryLabel: this.taxonomyCategoryLabel,
        department: this.subdepartmentDraft,
      });
    },
    async saveTaxonomyRequest(title, url, body) {
      this.busy = true;
      this.taxonomyError = '';

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const result = await response.json();

        if (!response.ok) {
          this.taxonomyError = result.validationErrors ? result.validationErrors.join('\n') : result.error || `${title} failed`;
          return false;
        }

        if (result.manifest) this.manifest = result.manifest;
        await this.refreshTaxonomy();
        await this.refreshGitStatus();
        this.lastAction = {
          title,
          ok: true,
          stdout: `${title} updated catalog taxonomy; catalog version is now ${this.manifest?.catalogVersion || 'unchanged'}.`,
          stderr: '',
        };
        return true;
      } catch (error) {
        this.taxonomyError = error instanceof Error ? error.message : String(error);
        return false;
      } finally {
        this.busy = false;
      }
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
    async runPreCommitValidation() {
      await this.runAction('Validate Before Commit', '/api/actions/validate-before-commit');
      await this.refreshGitStatus();
    },
    async refreshGitStatus() {
      const response = await fetch('/api/git/status');
      this.git = await response.json();
    },
    async loadGitDiff() {
      this.busy = true;
      this.lastAction = { title: 'Git Diff', ok: true, stdout: 'Loading diff...', stderr: '' };

      try {
        const response = await fetch('/api/git/diff');
        const result = await response.json();
        this.gitDiff = result.stdout || '';
        this.lastAction = {
          title: 'Git Diff',
          ok: result.ok,
          stdout: this.gitDiff || 'No diff output.',
          stderr: result.stderr || '',
        };
      } catch (error) {
        this.lastAction = { title: 'Git Diff', ok: false, stdout: '', stderr: error instanceof Error ? error.message : String(error) };
      } finally {
        this.busy = false;
      }
    },
    async commitChanges() {
      this.busy = true;
      this.lastAction = { title: 'Commit Changes', ok: true, stdout: 'Running validation and committing...', stderr: '' };

      try {
        const response = await fetch('/api/git/commit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: this.commitMessage }),
        });
        const result = await response.json();
        this.lastAction = { title: 'Commit Changes', ...result };

        if (response.ok) {
          this.commitMessage = '';
          this.gitDiff = '';
          await this.refreshGitStatus();
        }
      } catch (error) {
        this.lastAction = { title: 'Commit Changes', ok: false, stdout: '', stderr: error instanceof Error ? error.message : String(error) };
      } finally {
        this.busy = false;
      }
    },
    async pushChanges() {
      await this.runAction('Push Changes', '/api/git/push');
      await this.refreshGitStatus();
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
        await this.refreshGitStatus();
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
