---
title: "Food and Drinks"
layout: "dept-page.njk"
permalink: "/departments/{{ title | slug | url }}/{% if pagination.pageNumber > 0 %}{{pagination.pageNumber | plus: 1 }}/{% endif %}"
pagination:
  data: "collections.food-and-drinks"
  size: 25
  alias: "products"
---


