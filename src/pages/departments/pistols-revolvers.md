---js
{
  title: "Pistols, Revolvers",
  layout: "dept-page.njk",
  permalink: "/departments/weapons/{{ 'pistols-revolvers' | slug | url }}/{% if pagination.pageNumber > 0 %}{{pagination.pageNumber | plus: 1 }}/{% endif %}",
  pagination: {
    data: "collections.weaponProducts",
    size: 25,
    alias: "products",
    before: function(data) { 
      let coll = data.filter(x => x.tags.includes('pistol') || x.tags.includes('revolver'))
      return coll.sort((a,b) => (a.name < b.name) ? -1 : (a.name > b.name) ? 1 : 0)
    }
  }
}
---


