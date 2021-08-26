---js
{
  title: "Food & Drinks",
  layout: "dept-page.njk",
  permalink: "/departments/{{ 'food-drinks' | slug | url }}/{% if pagination.pageNumber > 0 %}{{pagination.pageNumber | plus: 1 }}{% endif %}/",
  pagination: {
    data: "food-drink-products",
    size: 20,
    alias: "products",
    before: function(data) { 
      return data.sort((a,b) => (a.name < b.name) ? -1 : (a.name > b.name) ? 1 : 0)
    }
  }
}
---


