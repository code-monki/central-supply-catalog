<script setup>
import { computed, onMounted, ref } from 'vue';

const cartKey = 'csc-cart';
const items = ref([]);

const formatCost = (value, shorten = true) => {
  const amount = Number(value) || 0;
  const thresholds = [
    [999999999999, 12, 'TCr'],
    [999999999, 9, 'BCr'],
    [999999, 6, 'MCr'],
    [999, 3, 'KCr'],
  ];

  for (const [threshold, exponent, unit] of thresholds) {
    if (amount > threshold) {
      const scaled = amount / 10 ** exponent;
      return `${shorten ? scaled.toFixed(3) : scaled} ${unit}`;
    }
  }

  return `${amount} Cr`;
};

const readCart = () => {
  try {
    const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
    items.value = Array.isArray(cart) ? cart : [];
  } catch {
    items.value = [];
  }
};

const saveCart = () => {
  localStorage.setItem(cartKey, JSON.stringify(items.value));
  window.dispatchEvent(new CustomEvent('csc-cart-updated'));
};

const total = computed(() =>
  items.value.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.unitPrice) || 0), 0)
);

const setQuantity = (sku, quantity) => {
  const item = items.value.find((entry) => entry.sku === sku);
  if (!item) return;

  const value = Number(quantity);
  item.qty = Number.isFinite(value) ? Math.max(Math.trunc(value), 0) : 0;
  saveCart();
};

const adjustQuantity = (sku, delta) => {
  const item = items.value.find((entry) => entry.sku === sku);
  if (!item) return;
  setQuantity(sku, (Number(item.qty) || 0) + delta);
};

const removeItem = (sku) => {
  items.value = items.value.filter((item) => item.sku !== sku);
  saveCart();
};

const emptyCart = () => {
  items.value = [];
  saveCart();
};

onMounted(readCart);
</script>

<template>
  <div class="shopping-cart">
    <h1>Shopping Cart</h1>

    <div class="row total-row">
      <div class="empty-cart-button">
        <button class="empty-cart" id="empty-cart" type="button" @click="emptyCart">Empty Cart</button>
      </div>

      <div class="cart-total-div">
        <h3><span id="cart-total" class="cart-total">{{ items.length ? `Total: ${formatCost(total, false)}` : '' }}</span></h3>
      </div>
    </div>

    <div class="cart-items-container">
      <div v-if="items.length === 0" class="row product-row">
        <h4 class="center">Cart is empty</h4>
      </div>

      <div v-for="item in items" :key="item.sku" class="row product-row">
        <div class="prod-img">
          <a :href="`/products/${item.sku}/`">
            <img :src="item.image" class="responsive-img" :alt="item.name">
          </a>
        </div>

        <div class="product-data">
          <div class="row title-and-total-div">
            <div class="prod-title">
              <a :href="`/products/${item.sku}/`" :data-sku="item.sku" class="item-name">{{ item.name }}</a>
            </div>

            <div class="prod-total">
              {{ formatCost((Number(item.qty) || 0) * (Number(item.unitPrice) || 0), true) }}
            </div>
          </div>

          <div class="row">
            <div class="prod-qty">
              <button type="button" aria-label="Decrease quantity" @click="adjustQuantity(item.sku, -1)">
                <span class="icon icon-minus subtract-btn" aria-hidden="true"></span>
              </button>
              <input
                type="number"
                class="qty"
                :value="item.qty"
                min="0"
                @change="setQuantity(item.sku, $event.target.value)"
              >
              <button type="button" aria-label="Increase quantity" @click="adjustQuantity(item.sku, 1)">
                <span class="icon icon-plus add-btn" aria-hidden="true"></span>
              </button>
              <button type="button" class="remove-item" aria-label="Remove item" @click="removeItem(item.sku)">
                <span class="icon icon-trash" aria-hidden="true"></span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
