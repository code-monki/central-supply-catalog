---
title: "Explosives"
layout: dept-page.njk
permalink: "/departments/{{ title | slug | url }}/{% if pagination.pageNumber > 0 %}{{pagination.pageNumber | plus: 1 }}{% endif %}/"
pagination:
  data: "explosives-products"
  size: 10
  alias: products
tags: pages
---


