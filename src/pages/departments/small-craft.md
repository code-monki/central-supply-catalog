---
title: 'Small Craft'
layout: 'dept-page.njk'
permalink: '/departments/{{ title | slugify | url }}/{% if pagination.pageNumber > 0 %}{{pagination.pageNumber | plus: 1 }}/{% endif %}'
pagination:
  data: 'collections.small-craft'
  size: 25
  alias: 'products'
---
