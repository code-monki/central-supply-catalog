---
title: 'Explosives'
layout: 'dept-page.njk'
permalink: '/departments/{{ title | slugify | url }}/{% if pagination.pageNumber > 0 %}{{pagination.pageNumber | plus: 1 }}/{% endif %}'
pagination:
  data: 'collections.explosives'
  size: 25
  alias: 'products'
---
