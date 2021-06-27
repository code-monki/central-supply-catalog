# Shopping Cart Analysis

## Preliminary Thoughts

The shopping cart shall hold all of the currently selected items and quantities. The data stored for each item shall consist of:

* Image of the item
* SKU as a hyperlink
* Name of the item
* Current quantity
* + / - buttons to allow the user to change the quantity
* Trashcan icon to remove the item
* Unit cost

The data for the shopping cart will be stored as an array in sessionStorage and will not persist if the browser is closed. The total price for each item will be calculated on the fly as will the final total.




