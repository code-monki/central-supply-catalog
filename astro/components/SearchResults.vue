<script setup>
import MiniSearch from 'minisearch';
import { computed, onMounted, ref } from 'vue';

const props = defineProps({
  documents: {
    type: Array,
    required: true,
  },
  fallbackImage: {
    type: String,
    required: true,
  },
});

const query = ref('');
const results = ref([]);

const formatCost = (value) => {
  const amount = Number(value) || 0;
  const thresholds = [
    [999999999999, 12, 'TCr'],
    [999999999, 9, 'BCr'],
    [999999, 6, 'MCr'],
    [999, 3, 'KCr'],
  ];

  for (const [threshold, exponent, unit] of thresholds) {
    if (amount > threshold) return `${(amount / 10 ** exponent).toFixed(3)} ${unit}`;
  }

  return `${amount} Cr`;
};

const hasSearch = computed(() => query.value.length > 0);

onMounted(() => {
  const params = new URLSearchParams(window.location.search);
  query.value = (params.get('s') || '').trim();
  if (!query.value) return;

  const miniSearch = new MiniSearch({
    idField: 'sku',
    fields: ['sku', 'name', 'description', 'cost'],
    storeFields: ['sku', 'name', 'summary', 'cost', 'image'],
  });

  miniSearch.addAll(props.documents);
  results.value = miniSearch.search(query.value, { prefix: true });
});
</script>

<template>
  <div v-if="hasSearch" class="search-results" id="search-results">
    <div class="row results-header">
      <h2>Search found {{ results.length }} results for: <em>{{ query }}</em></h2>
    </div>

    <div class="container">
      <div v-for="product in results" :key="product.sku" class="search-result-row">
        <div class="prod-img">
          <img
            :src="product.image || props.fallbackImage"
            class="thumbnail-img"
            :alt="product.name"
            width="120"
            height="120"
            loading="lazy"
            decoding="async"
          >
        </div>

        <div class="product-summary">
          <a :href="`/products/${product.sku}/`"><h3>{{ product.name }}</h3></a>
          <p>{{ product.summary }}</p>
          <div class="product-cost">
            <div class="right-align">{{ formatCost(product.cost) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
