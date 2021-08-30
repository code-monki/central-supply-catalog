---
  title: "Protections"
  layout: "dept-page.njk"
  permalink: "/departments/{{ 'protections' | slug | url }}/{% if pagination.pageNumber > 0 %}{{pagination.pageNumber | plus: 1 }}/{% endif %}"
  pagination:
    data: "collections.protectionsProducts"
    size: 40
    alias: "products"
---


