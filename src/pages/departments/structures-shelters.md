---js
{
title: "Structures & Shelters",
layout: "dept-page.njk",
permalink: "/departments/{{ 'structures-shelters' | slug | url }}/{% if pagination.pageNumber > 0 %}{{pagination.pageNumber | plus: 1 }}/{% endif %}",
pagination: {
  data: "structures-products",
  size: 25,
  alias: "products",
  before: function(data) { 
    return data.sort((a,b) => (a.name < b.name) ? -1 : (a.name > b.name) ? 1 : 0)
    }
  }
}
---


