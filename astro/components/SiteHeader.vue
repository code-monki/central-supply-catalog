<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { warmSearchIndex } from '../lib/searchIndexClient.js';

const props = defineProps({
  menu: {
    type: Array,
    required: true,
  },
  searchIndexUrl: {
    type: String,
    required: true,
  },
  searchIndexVersion: {
    type: String,
    required: true,
  },
  baseUrl: {
    type: String,
    required: true,
  },
});

const isMenuOpen = ref(false);
const isDepartmentOpen = ref(false);
const departmentMenu = ref(null);
const searchTerm = ref('');
const cartCount = ref(0);

const visibleBadge = computed(() => cartCount.value > 0);
const withBase = (path) => {
  if (!path || /^(?:[a-z]+:)?\/\//i.test(path)) return path;
  const base = props.baseUrl.endsWith('/') ? props.baseUrl : `${props.baseUrl}/`;
  if (path === '/') return base;
  if (path.startsWith(base)) return path;
  return `${base}${path.replace(/^\/+/, '')}`;
};

const updateCartCount = () => {
  try {
    const cart = JSON.parse(localStorage.getItem('csc-cart') || '[]');
    cartCount.value = Array.isArray(cart) ? cart.length : 0;
  } catch {
    cartCount.value = 0;
  }
};

const submitSearch = () => {
  const terms = searchTerm.value.trim().replace(/\s+/g, '+');
  if (terms) window.location.href = withBase(`/support/search/?s=${terms}`);
};

const closeDepartmentMenu = () => {
  isDepartmentOpen.value = false;
};

const handleDocumentClick = (event) => {
  if (!isDepartmentOpen.value) return;
  if (departmentMenu.value?.contains(event.target)) return;
  closeDepartmentMenu();
};

const handleDocumentKeydown = (event) => {
  if (event.key === 'Escape') closeDepartmentMenu();
};

onMounted(() => {
  updateCartCount();
  warmSearchIndex({
    url: props.searchIndexUrl,
    version: props.searchIndexVersion,
  });
  window.addEventListener('storage', updateCartCount);
  window.addEventListener('csc-cart-updated', updateCartCount);
  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('keydown', handleDocumentKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('storage', updateCartCount);
  window.removeEventListener('csc-cart-updated', updateCartCount);
  document.removeEventListener('click', handleDocumentClick);
  document.removeEventListener('keydown', handleDocumentKeydown);
});
</script>

<template>
  <nav class="sidenav-menu" id="sidenav-menu" aria-label="Main navigation" :style="{ width: isMenuOpen ? '100%' : '0' }">
    <button class="close-sidenav" id="close-sidenav" aria-label="Close navigation" @click="isMenuOpen = false">
      <span class="icon icon-close" aria-hidden="true"></span>
    </button>
    <a :href="withBase('/')">Home</a>
    <a :href="withBase('/shopping-cart')">Shopping Cart</a>
    <a :href="withBase('/about-the-central-supply-catalog')">About</a>
    <a :href="withBase('/disclaimers')">Disclaimers</a>
    <a :href="withBase('/help')">Help</a>
    <a :href="withBase('/support/')">Support</a>
  </nav>

  <header>
    <div class="row header-row-1">
      <div class="menu">
        <button class="sidenav-trigger" id="menu-button" aria-label="Open navigation" @click="isMenuOpen = true">
          <span class="unicode-icon" aria-hidden="true">≡</span>
        </button>
      </div>

      <div class="site-logo">
        <a :href="withBase('/')">Central Supply Catalog</a>
      </div>

      <div class="cart" id="shopping-cart">
        <a :href="withBase('/shopping-cart')" aria-label="Shopping cart">
          <span class="unicode-icon cart-icon" aria-hidden="true">🛒</span>
          <small v-if="visibleBadge" class="badge" id="cart-badge">{{ cartCount }}</small>
        </a>
      </div>
    </div>

    <div class="row header-row-2">
      <div class="row-2-content">
        <div ref="departmentMenu">
          <button class="dept-btn" id="dept-btn" type="button" :aria-expanded="isDepartmentOpen" aria-controls="dept-dropdown" @click="isDepartmentOpen = !isDepartmentOpen">
            Departments
          </button>
          <div class="dept-dropdown" id="dept-dropdown" :style="{ display: isDepartmentOpen ? 'block' : 'none' }">
            <ul>
              <li v-for="category in props.menu" :key="category.label">
                <a :href="category.href" :class="{ 'menu-item': category.departments.length === 0 }">{{ category.label }}</a>
                <ul v-if="category.departments.length > 0">
                  <li v-for="department in category.departments" :key="department.label">
                    <a :href="department.href" class="submenu-item">{{ department.label }}</a>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
        <div class="search-form">
          <form @submit.prevent="submitSearch">
            <label class="visually-hidden" for="search-input">Search catalog</label>
            <input v-model="searchTerm" type="text" name="search" class="search-input" id="search-input">
            <button class="search-btn" id="search-button" type="submit" aria-label="Search catalog">
              <span aria-hidden="true">🔍</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  </header>
</template>
