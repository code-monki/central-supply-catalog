# Local Storage Notes

The application provides several features that require some sort of local storage. Those features are:

* Full-text search
* Shopping Cart

## Full Text Search

The full text search will be provided by the minisearch package. This package is also used to generate the search index. The inventory item fields included in the search data are:

* name - Name of inventory item
* mfr - Name of the manufacturer
* techLevel - Minimum technology level
* description - Description of the inventory item

The full text search will have an associated key:value pair to indicate the date the index was generated to assist in determining whether or not the index needs to be reacquired.

### Operational Flow

#### Use Case 1 - Index Is Not Stored in Localstorage

1. The system will check to see whether or not it has the search index stored in local storage.
2. If the search index does not exist, the system will retrieve the index data and store it in local storage.
3. The system will then retrieve the timestamp object and store it as a separate entry.
4. The use case ends when the search index and timestamp object have been stored into local storage.

#### Use Case 2 - Index is Stored in Localstorage, Timestamp Valid

1. The system will check to see whether or not the search index is stored in local storage.
2. If the search index is not stored in local storage, the system will execute Use Case 1
3. The system will check for an existing timestamp object.
4. The system will retrieve the remote timestamp object.
5. The system will compare the two timestamps to verify they are the same.
6. If the two timestamps are the same, the use case ends.
7. If the retrieved timestamp is more recent than the stored timestamp, the system will store the new timestamp then retrieve and store the search index.
8. The use case ends after the search index and timestamp are stored in localstorage.

### Benefits

This approach allows the browser to quickly access the search index locally which translates into savings in time and bandwidth as the search index can become quite large. The use of the timestamp ensures that the search index is only retrieved from the host when it has been updated.

### Drawbacks

This approach causes the browser to consume more system memory resources that are not offloaded until the browser is closed. 

### Other Thoughts
A simpler, more system-friendly approach might be to ditch the search index and timestamp when the browser closes, but so far that does not seem to be particularly easy to do nor 100% reliable.


## Shopping Cart

The shopping cart requires the use of localstorage to persist the selected items between pages and tabs. The data that will be kept in each item in the shopping cart is:

* name - Name of product
* url - URL of product page
* unitCost - cost per indiidual unit
* quantity - number of items for this product
* image - url of image associated with the item

These attributes can be retrieved from the product page when the add to cart button is clicked. When the shopping cart page is displayed, it will self-populate from the shopping cart in localstorage. If the empty cart button is clicked, the shopping cart object in localstorage will be removed.