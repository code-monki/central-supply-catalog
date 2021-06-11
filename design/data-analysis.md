# Data Analysis

## Overview

This document contains the analyses of the various goods from the Traveller&trade; SFRPG, Cepheus Engine, the Traveller Wiki and other sources. The purpose of the document is to determine what data all of the goods have in common and which goods have unique data to properly construct the data structures that will be used by the Central Supply Catalog.

## Minimum Data

The following table contains the minimum data required to support the catalog:

| Attribute | Type | Description |
| ---- | ---- | ---- |
| id | integer | Unique identifier |
| product name | string | Descriptive product name |
| categories | string | Product categories |
| manufacturer | string | Name of manufacturer |
| tech level | integer | Minimum tech level |
| summary | string | Brief summary of product |
| description | string | Freeform text area for detailed description |
| credits | double | Cost of the item in credits |
| mass | double | Weight of item in kilograms |
| dimensions | object | dimensions ( L x W x H ) in centimeters |
| QREBS | string | Manufacturing quality basic parameters |
| source | string | Source of content item (author, publication, etc.|
| version | string | Version of Traveller |

### Product Name

The product name is intended to provide the user with a short, understandable name for an item. The majority of the items will likely be somewhat generic, i.e., "shotgun" or "tent", but a more descriptive title can be used as well, e.g., "Pump Shotgun" or "6-man Tent". Regardless, the length of the product name should not exceed 80 characters.

### Categories

Categories provide the basis for building custom collections for search purposes. An item should have at least one category, but some items may have multiple categories that are applicable.

### Manufacturer

The manufacturer attribute for generic products will likely be empty for the most part but it does provide a place for those who wish to add a manufacturer to the product.

### Tech Level

The minimum tech level for the product.

### Summary

The summary is a short description that appears on the products search page and may be an excerpt of the full description.

### Description

The description provides more information about the product and is a free-form text area. Care should be taken to avoid putting game mechanics in the description.

### Credits

The cost of the item in Imperial credits.

### Mass

The mass of the item in kilograms.

### Dimensions

The dimensions provide a text area that can be used to define the size of the product. All measurements are metric.

### QREBS

The QREBS value describes the Quality, Reliability, Ease Of Use, Bulk (or Burden) and Safety of the product. This characteristic was introduced in Traveller 5 and may not exist in other versions of Traveller.

### Source

The source attribute contains the attribution for the product and may contain one or more links. The intention is to point the user to the appropriate primary source. The CSC is not intended to house game mechanics but rather is intended to act as a consumer catalog for goods.

### Version

The optional version attribute contains the version (or versions) of Traveller that mention the product.  Currently the versions are:

* Classic Traveller
* MegaTraveller
* Traveller: The New Era
* T4: Marc Miller's Traveller
* Traveller 5
* Traveller20
* GURPS Traveller: Interstellar Wars
* Traveller Hero
* Mongoose Traveller
* Traveller5
* Mongoose Traveller 2nd ed.


## Data Store

The data for the CSC shall be stored as a file in JSON format. This data shall provide the basis for generating the pages of the catalog as well as any subsequent indices that may be required.

## Data Store Structure

{
  "products" : {
    ...
  }
}

## Product Data Structure

The product id shall be used to create the permalink to ensure that urls are unique.

```
    {
      "productId" : number,
      "shortName": "Shotgun",
      "longName" : This is a really fun thing to go boom!",
      "categories": [
        "category 1",
        "category 2",
        ...
      ],
      "manufacturer": "Delgado Trading",
      "techLevel" : 12,
      "techStage" : "Advanced",
      "costInCredits" : 1000,
      "massInKg" : 3,
      "dimensions" : {
        "height": "15cm",
        "width": "5cm",
        "length": "1m",
        "volume": "N/A"
      },
      "qrebs": {
        "quality": 4,
        "reliability": 4,
        "easeOfUse": 3,
        "burden": 3,
        "safety": 4
      },
      "summary": "Insert a short summary here",
      "description": "Insert a longer description here...",
      "source": "Cite the source of the product data here...",
      "version": [
        "All"
      ]
    }
```