---js
{
title: "Comms",
layout: "dept-page.njk",
permalink: "/departments/{{ title | slug | url }}/{% if pagination.pageNumber > 0 %}{{pagination.pageNumber | plus: 1 }}{% endif %}",
pagination: {
  data: "comm-products",
  size: 10,
  alias: "products",
  before: function(data) { 
    return data.sort((a,b) => (a.name < b.name) ? -1 : (a.name > b.name) ? 1 : 0)
    }
  }
}
---


