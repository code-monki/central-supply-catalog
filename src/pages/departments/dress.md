---
title: "Dress"
layout: "dept-page.njk"
permalink: "/departments/{{ 'dress' | slug | url }}/{% if pagination.pageNumber > 0 %}{{pagination.pageNumber | plus: 1 }}/{% endif %}"
pagination:
  data: "collections.dress"
  size: 25
  alias: "products"
---


