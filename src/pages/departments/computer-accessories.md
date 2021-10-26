---js
{
  title: "Computer Accessories",
  layout: "dept-page.njk",
  permalink: "/departments/computers/{{ 'computer-accessories' | slug | url }}/{% if pagination.pageNumber > 0 %}{{pagination.pageNumber | plus: 1 }}/{% endif %}",
  pagination: {
    data: "computer-products",
    size: 25,
    alias: "products",
    before: function(data) { 
      let coll = data.filter(x => x.tags.includes("computer accessory"))
      return coll.sort((a,b) => (a.name < b.name) ? -1 : (a.name > b.name) ? 1 : 0)
    }
  }
}
---


