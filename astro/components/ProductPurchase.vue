<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
  formattedCost: {
    type: String,
    required: true,
  },
  imageSrc: {
    type: String,
    required: true,
  },
});

const cartKey = 'csc-cart';
const quantity = ref(1);
const statusMessage = ref('');

const safeQuantity = computed(() => {
  const value = Number(quantity.value);
  if (!Number.isFinite(value)) return 1;
  return Math.min(Math.max(Math.trunc(value), 0), 999);
});

const readCart = () => {
  try {
    const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
    return Array.isArray(cart) ? cart : [];
  } catch {
    return [];
  }
};

const saveCart = (cart) => {
  localStorage.setItem(cartKey, JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent('csc-cart-updated'));
};

const addToCart = () => {
  const qty = safeQuantity.value;
  if (qty < 1) return;

  const cart = readCart();
  const existing = cart.find((item) => item.sku === props.product.sku);

  if (existing) {
    existing.qty = Number(existing.qty || 0) + qty;
  } else {
    cart.push({
      sku: props.product.sku,
      qty,
      name: props.product.name,
      unitPrice: Number(props.product.cost) || 0,
      image: props.imageSrc,
    });
  }

  cart.sort((a, b) => a.name.localeCompare(b.name));
  saveCart(cart);
  statusMessage.value = 'Item added to cart';
};
</script>

<template>
  <form @submit.prevent="addToCart">
    <div id="unit-price" class="unit-price" :data-unitprice="props.product.cost">{{ props.formattedCost }}</div>
    <div class="input-field quantity">
      <label for="product-qty">Qty:</label>
      <input v-model.number="quantity" type="number" name="qty" id="product-qty" min="0" max="999">
    </div>
    <div class="add-products-btn">
      <button type="submit" class="btn-small amber black-text add-to-cart" id="add-to-cart">Add To Cart</button>
    </div>
    <p v-if="statusMessage" class="cart-status" role="status">{{ statusMessage }}</p>
  </form>
</template>
