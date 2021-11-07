# Data Analysis

## Overview

This document contains the analyses of the various goods from the Traveller&trade; SFRPG, Cepheus Engine, the Traveller Wiki and other sources. The purpose of the document is to determine what data all of the goods have in common and which goods have unique data to properly construct the data structures that will be used by the Central Supply Catalog.

## Minimum Data

The following table contains the minimum data required to support the catalog:

| Attribute   | Type              | Description                                       |
| ----------- | ----------------- | ------------------------------------------------- |
| prodId      | integer           | Unique identifier                                 |
| mfrId       | string            | Manufacturer id                                   |
| shortCode   | string            | Short code to summarize item                      |
| prodName    | string            | Descriptive product name                          |
| summary     | string            | Brief summary of product                          |
| description | string            | Freeform text area for detailed description       |
| itemTypeId  | integer           | Item type identifier                              |
| tech level  | integer           | Minimum tech level                                |
| cost        | double            | Cost of the item in credits                       |
| mass        | double            | Weight of item in kilograms                       |
| accessories | array of prod ids | List of accessories for the product               |
| qrebs       | string            | Manufacturing quality basic parameters            |
| source      | array of objects  | Source of content item (author, publication, etc. |
| categories  | array of strings  | Product categories                                |
| tags        | array of strings  | Tags for product                                  |

#### Holding Room Attributes

| Attribute  | Type   | Description                             |
| ---------- | ------ | --------------------------------------- |
| dimensions | object | dimensions ( L x W x H ) in centimeters |
| version    | string | Compatible version(s) of Traveller      |

### Product Name

The product name is intended to provide the user with a short, understandable name for an item. The majority of the items will likely be somewhat generic, i.e., "shotgun" or "tent", but a more descriptive title can be used as well, e.g., "Pump Shotgun" or "6-man Tent". Regardless, the length of the product name should not exceed 80 characters.

### Categories

Categories provide the basis for building custom collections for search purposes. An item should have at least one category, but some items may have multiple categories that are applicable.

### Manufacturer

The manufacturer attribute for generic products will likely be empty for the most part but it does provide a place for those who wish to add a manufacturer to the product.

### Tech Level

The minimum tech level for the product.

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

The optional version attribute contains the version (or versions) of Traveller that mention the product. Currently the versions are:

- Classic Traveller
- MegaTraveller
- Traveller: The New Era
- T4: Marc Miller's Traveller
- Traveller 5
- Traveller20
- GURPS Traveller: Interstellar Wars
- Traveller Hero
- Mongoose Traveller
- Traveller5
- Mongoose Traveller 2nd ed.

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
      "sku": "010-001-000001"    // 010 - department id; 001 - mfr id; 000001 - product id
      "shortName": "Shotgun",
      "longName" : This is a really fun thing to go boom!",
      "department" : "010",
      "categories": [
        "department 1",
        "department 2",
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
      "description": "Insert a longer description here...",
      "source": [{}],
      "version": [
        "All"
      ]
    }
```

### Categories

#### Breathing Apparatus

| Dept. Code | Description         |
| ---------- | ------------------- |
| 010-000    | Breathing Apparatus |

#### Communications Gear

| Dept. Code | Description         |
| ---------- | ------------------- |
| 020-000    | Communications Gear |

#### Computer Gear

| Dept. Code | Description          |
| ---------- | -------------------- |
| 030-000    | Computers            |
| 030-001    | Computer Accessories |

#### Construction

| Dept. Code | Description            |
| ---------- | ---------------------- |
| 040-000    | Construction           |
| 040-001    | Construction Materials |

#### Containers

| Dept. Code | Description |
| ---------- | ----------- |
| 050-000    | Containers  |

#### Detectors

| Dept. Code | Description |
| ---------- | ----------- |
| 060-000    | Detectors   |

#### Emitters

| Dept. Code | Description |
| ---------- | ----------- |
| 070-000    | Emitters    |

#### Explosives

| Dept. Code | Description |
| ---------- | ----------- |
| 080-000    | Explosives  |

#### Food & Drinks

| Dept. Code | Description   |
| ---------- | ------------- |
| 090-000    | Food & Drinks |

#### Medical & Drugs

| Dept. Code | Description     |
| ---------- | --------------- |
| 100-000    | Medical & Drugs |

#### Non-Breathing Gases

| Dept. Code | Description         |
| ---------- | ------------------- |
| 110-000    | Non-breathing Gases |

#### Power Supplies

| Dept. Code | Description    |
| ---------- | -------------- |
| 120-000    | Power Supplies |

#### Protections

| Dept. Code | Description   |
| ---------- | ------------- |
| 130-000    | Armor         |
| 130-001    | Dress         |
| 130-002    | Suits         |
| 130-003    | Units         |
| 130-004    | Cyberware     |
| 130-005    | Survival Gear |

#### Robotics

| Dept. Code | Description  |
| ---------- | ------------ |
| 140-000    | Robots       |
| 140-001    | Automatons   |
| 140-002    | Drones       |
| 140-003    | Strangeforms |

#### Structures & Shelters

| Dept. Code | Description          |
| ---------- | -------------------- |
| 150-000    | Structures, Shelters |

#### Surface Gear

| Dept. Code | Description  |
| ---------- | ------------ |
| 160-000    | Surface Gear |

#### Toolkits

| Dept. Code | Description |
| ---------- | ----------- |
| 170-000    | Toolkits    |

#### Transportation

| Dept. Code | Description       |
| ---------- | ----------------- |
| 180-000    | Personal Vehicles |
| 180-001    | Small Craft       |
| 180-002    | Space Craft       |

#### Uniques & Valuata

| Dept. Code | Description       |
| ---------- | ----------------- |
| 190-000    | Uniques & Valuata |

#### Weapons

| Dept. Code | Description        |
| ---------- | ------------------ |
| 200-000    | Melee              |
| 200-001    | Blades             |
| 200-002    | Handguns           |
| 200-003    | Shotguns           |
| 200-004    | Machineguns        |
| 200-005    | Long Guns          |
| 200-006    | Heavy Weapons      |
| 200-007    | Launchers          |
| 200-008    | Projectors         |
| 200-009    | Designators        |
| 200-010    | Ammunition         |
| 200-011    | Weapon Accessories |

### Tech Levels

<table>
  <thead>
    <tr>
      <th>Dec</th><th>Hex</th><th>&nbsp;</th>
      <th>Dec</th><th>Hex</th><th>&nbsp;</th>
      <th>Dec</th><th>Hex</th><th>&nbsp</th>
      <th>Dec</th><th>Hex</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>0</td><td>0</td><td>&nbsp;</td>
      <td>9</td><td>9</td><td>&nbsp;</td>
      <td>18</td><td>J</td><td>&nbsp;</td>
      <td>27</td><td>T</td>
    </tr>
    <tr>
      <td>1</td><td>1</td><td>&nbsp;</td>
      <td>10</td><td>A</td><td>&nbsp;</td>
      <td>19</td><td>K</td><td>&nbsp;</td>
      <td>28</td><td>U</td>
    </tr>
    <tr>
      <td>2</td><td>2</td><td>&nbsp;</td>
      <td>11</td><td>B</td><td>&nbsp;</td>
      <td>19</td><td>L</td><td>&nbsp;</td>
      <td>28</td><td>V</td>
    </tr>
    <tr>
      <td>3</td><td>3</td><td>&nbsp;</td>
      <td>12</td><td>C</td><td>&nbsp;</td>
      <td>21</td><td>M</td><td>&nbsp;</td>
      <td>30</td><td>W</td>
    </tr>
    <tr>
      <td>4</td><td>4</td><td>&nbsp;</td>
      <td>13</td><td>D</td><td>&nbsp;</td>
      <td>22</td><td>N</td><td>&nbsp;</td>
      <td>31</td><td>X</td>
    </tr>
    <tr>
      <td>5</td><td>5</td><td>&nbsp;</td>
      <td>14</td><td>E</td><td>&nbsp;</td>
      <td>23</td><td>P</td><td>&nbsp;</td>
      <td>32</td><td>Y</td>
    </tr>
    <tr>
      <td>6</td><td>6</td><td>&nbsp;</td>
      <td>15</td><td>F</td><td>&nbsp;</td>
      <td>24</td><td>Q</td><td>&nbsp;</td>
      <td>33</td><td>Z</td>
    </tr>
    <tr>
      <td>7</td><td>7</td><td>&nbsp;</td>
      <td>16</td><td>G</td><td>&nbsp;</td>
      <td>25</td><td>R</td>
      <td colspan="3" rowspan="2">&nbsp;</td>
    </tr>
    <tr>
      <td>8</td><td>8</td><td>&nbsp;</td>
      <td>17</td><td>H</td><td>&nbsp;</td>
      <td>26</td><td>S</td>
    </tr>
</table>

**NOTES**
