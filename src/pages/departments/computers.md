---
title: "Computers"
layout: dept-page.njk
permalink: "/departments/{{ title | slug | url }}/{% if pagination.pageNumber > 0 %}{{pagination.pageNumber | plus: 1 }}{% endif %}/index.html"
pagination:
  data: "computer-products"
  size: 5
  alias: products
tags: pages
---


