---
layout: product-page.njk
pagination:
  data: products
  size: 1
  alias: product
permalink: "./products/{{ product.sku | string | slugify }}.html"
---
