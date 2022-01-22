---
title: 'Designators'
layout: 'dept-page.njk'
permalink: "/departments/{{ 'designators' | slugify | url }}/{% if pagination.pageNumber > 0 %}{{pagination.pageNumber | plus: 1 }}/{% endif %}"
pagination:
  data: 'collections.designators'
  size: 25
  alias: 'products'
---
