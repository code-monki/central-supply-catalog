---js
{
  title: "Non-Breathing Gases",
  layout: "dept-page.njk",
  permalink: "/departments/{{ 'non-breathing-gases' | slug | url }}/{% if pagination.pageNumber > 0 %}{{pagination.pageNumber | plus: 1 }}/{% endif %}",
  pagination: {
    data: "non-breathing-gas-products",
    size: 25,
    alias: "products",
    before: function(data) { 
      return data.sort((a,b) => (a.name < b.name) ? -1 : (a.name > b.name) ? 1 : 0)
    }
  }
}
---


