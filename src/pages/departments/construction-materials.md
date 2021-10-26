---js
{
  title: "Construction Materials",
  layout: "dept-page.njk",
  permalink: "/departments/construction/{{ 'construction-materials' | slug | url }}/{% if pagination.pageNumber > 0 %}{{pagination.pageNumber | plus: 1 }}/{% endif %}",
  pagination: {
    data: "construction-products",
    size: 25,
    alias: "products",
    before: function(data) { 
      let coll = data.filter(x => x.tags.includes("construction materials"))
      return coll.sort((a,b) => (a.name < b.name) ? -1 : (a.name > b.name) ? 1 : 0)
    }
  }
}
---


