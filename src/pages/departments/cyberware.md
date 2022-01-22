---
title: 'Cyberware'
layout: 'dept-page.njk'
permalink: "/departments/{{ 'cyberware' | slugify | url }}/{% if pagination.pageNumber > 0 %}{{pagination.pageNumber | plus: 1 }}/{% endif %}"
pagination:
  data: 'collections.cyberware'
  size: 25
  alias: 'products'
---
