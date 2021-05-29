# Design Notes

---

## Overview

This document contains notes related to the design and implementation of the Central Supply Catalog.

---

## Licensing Issues


### Open Game License


The Cepheus Engine fallsd under the Open Game License (OGL) version 1.0a. This license requires that all OGL content be identified as such and in a manner that it can be easily identified. Given the nature of the OGL content that will be used, i.e., the descriptions and characterists of goods, each item will have an associate entry indicating the source of the entry in the data files.

### Traveller

Marc Miller has generously given his approval and support for the project and volunteered to send images.

### Traveller Wiki

The Traveller Wiki Stewards have given their permission to use content from the Traveller Wiki in exchange for permission to use content from the Central Supply Catalog site.

### Individual Authors

The process to contact individual authors is underway and their content will be added upon receiving approval to do so.

---

## Design Decisions

### Technologies

The site will be implemented as a static web site that is hosted on GitHub (unless traffic / content volumes require it to be hosted elsewhere). The site itself will utilize HTML 5, CSS 3, and Javascript to provide all displays and functionality.

### Data Files

All data shall be stored in JSON-formatted files. The goal is to eliminate the need for external services such as a database. However, this will require a number of different data formats as well as matching partials for the cards.

Care must also be taken when constructing the data formats to support the different views required by the catalog.

Data templates shall be created to enable contributions to the catalog.

### Search

Search results need to be separated by category, not just lumped together. Unlike a full-text site search, each category will need to be searched for matching results.

### Hero Section

Currently has fixed image, but need to use that area as a carousel for the major sections.

### Departments

The different types of goods are arbitrarily placed in "departments" to facilitate the creation of custom collections that can be used with filters and search.

**Electronics**

- Communicators
- Computers
- Comp. Access.
- Detectors

**Personal Equipment**

- Armor
- Beverages
- Clothing
- Drugs
- Food
- Medical
- Miscellaneous

**Robots & Drones**

- Automatons
- Drones
- Robots
- Strangeforms

**Survival**

- Cables
- Const. Matls
- Fuel
- Gases
- Liquids
- Hydraulics
- Power
- Shelters
- Structures
- Surface Gear
- Toolkits

**Vehicles**

- Aircraft
- Grav
- Tracked & Wheeled
- Watercraft

**Weapons**

- Accesories
- Ammunition
- Weapons

---

## Mobile-First, Responsive Issues

Although the best user experience will be realized on a desktop or tablet screen, the reality is that most users will access web sites via their smartphones. The challenge with supporting the multitude of viewport sizes is manageable through the use of media queries and focusing on a priority-based perspective for smaller viewport sizes. The following breakpoints are initially suggested to accommodate the largest majority of devices.

### Media Query Breakpoints

The six most common portrait orientation viewport sizes seem to be:

| Width | Height |
| ----: | -----: |
|   360 |    640 |
|   375 |    720 |
|   667 |    768 |
|   768 |   1024 |
|  1366 |    768 |
|  1920 |   1080 |

Rather than re-inventing the wheel, we will use the breakpoints provided by the Bootstrap<a href="#fn1" id="fnote1"><sup>1</suo></a> framework even though we will not be using that framework. To wit,

| Breakpoint        | Class Infix | Dimensions  |
| ----------------- | :---------: | ----------- |
| X-Small           |   _None_    | < 576px     |
| Small             |     sm      | &ge; 576px  |
| Medium            |     md      | &ge; 768px  |
| Large             |     lg      | &ge; 992px  |
| Extra Large       |     xl      | &ge; 1200px |
| Extra Extra Large |     xxl     | &ge; 1400px |

## Use Cases

The following use cases describe the features of the site:

### Search for catalog item

The use case begins when the user clicks the search icon. The user is presented with a search dialog that contains filters for department and tech level and an area for search terms. The user enters the search terms and filter criteria and clicks the search button to retrieve any matching items. The use case ends when the user is presented with a list of matching items.

Alternatively the user may be presented with a screen indicating there were no matching items or the user may choose to cancel the search.

### Browse

The use case begins when the user clicks the menu button and selects the browse option. The system presents the user with a collection of categories and departments corresponding to those categories. The user selects a department of interest and is taken to the catalog listing for the department. The use case ends when the user has been taken to the department screen.

### Browse Department Items

The use case begins when the user arrives at the department screen. The system presents the user with a scrollable collection of items associated with the department. The user can optionally add items to a shopping cart or click the item itself to see the full description page associated with the item. The case ends when the user exits the screen to the home page or the cart.

### Display Catalog Item Screen

The use case begins when the user arrives at the catalog item screen. The user has the option of adding the item to the cart or returning to the browse catalog screen. The use case ends when the user exits the screen.

### Add Items to Cart

The use case begins when the user chooses to add items to the cart. The user will select a quantity of the item and click the buy button to add the item(s) to the cart. The use case ends when the items have been added to the cart.

### Display Cart

The use case begins when the user clicks the cart link. The system displays the shopping cart contents with a total. The use case ends when the shopping cart contents have been displayed.

### Modify the Quantity of an item

The use case begins when the user chooses to modify the quantity of an item in the shopping cart. The user increases or decreases the quantity of the item via +/- buttons. The use case ends when the user has finished modifying the quantity.

### Remove Items from Cart

The use begins when the user chooses to remove an item from the shopping cart. The user will click the trash can icon and the system will remove the item from the shopping cart. The use case ends when the item has been removed and the screen has been refreshed.


## Department Filter Control - Deferred for future version

The Department Filter button allows the user to limit the product search to a particular department. The button will initially have the label of "All Depts" to indicate that the search terms will be used to look across all of the products. The general flow is:

- User clicks Departments Filter button
- List of departments is displayed grouped by category
- User clicks a department to select
- Department list closes and label of Departments filter button is replaced with the selected department

The user may also click the Departments Filter button while the list is displayed to close the list without selecting a new department. The presentation of the list is a single-column scrolling list of departments in alphabetical order. Each item in the list has a click event to detect a mouse click. Clicking outside of the list will close the list without changing the label of the button. Clicking on a department will close the list and change the label on the button.

On screens less than 400px, the list will expand to cover the entire horizontal width. On screens greater than 400px, the list will expand to it's natural width.

**NOTE:** This control should not be confused with the shop by category/department menu item.




----
<sup>1</sup> [Bootstrap Breakpoints](https://getbootstrap.com/docs/5.0/layout/breakpoints/)