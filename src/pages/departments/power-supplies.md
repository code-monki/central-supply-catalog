---
title: 'Power Supplies'
layout: 'dept-page.njk'
permalink: '/departments/{{ title | slugify | url }}/{% if pagination.pageNumber > 0 %}{{pagination.pageNumber | plus: 1 }}/{% endif %}'
pagination:
  data: 'collections.power-supplies'
  size: 25
  alias: 'products'
---
