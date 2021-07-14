# Data Analysis

## Overview

This document contains the analyses of the various goods from the Traveller&trade; SFRPG, Cepheus Engine, the Traveller Wiki and other sources. The purpose of the document is to determine what data all of the goods have in common and which goods have unique data to properly construct the data structures that will be used by the Central Supply Catalog.

## Minimum Data

The following table contains the minimum data required to support the catalog:

| Attribute    | Type              | Description                                       |
| ------------ | ----------------- | ------------------------------------------------- |
| prodId       | integer           | Unique identifier                                 |
| mfrId        | string            | Manufacturer id                                   |
| shortCode    | string            | Short code to summarize item                      |
| prodName     | string            | Descriptive product name                          |
| summary      | string            | Brief summary of product                          |
| description  | string            | Freeform text area for detailed description       |
| itemTypeId   | integer           | Item type identifier                              |
| tech level   | integer           | Minimum tech level                                |
| cost         | double            | Cost of the item in credits                       |
| mass         | double            | Weight of item in kilograms                       |
| accesssories | array of prod ids | List of accessories for the product               |
| qrebs        | string            | Manufacturing quality basic parameters            |
| source       | array of objects  | Source of content item (author, publication, etc. |
| categories   | array of strings  | Product categories                                |
| tags         | array of strings  | Tags for product                                  |

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
      "productId" : 1,
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
      "summary": "Insert a short summary here",
      "description": "Insert a longer description here...",
      "source": "Cite the source of the product data here...",
      "version": [
        "All"
      ]
    }
```

**NOTES**

Need to account for:

1. Weapon Classification
1. Melee
1. Blade
1. Short
1. Medium
1. Long
1. Heavy Weapons
1. Rifles / Carbines
1. Handguns / Revolvers
1. Shotguns
1. Designator
1. Projections
1. Launchers
1. Accessory
1. Ammunitiion

1. Armor Classification (Armor, Dress)

1. Suit Classification

### Categories

Electronics
Medical
Personal Items
Protections
Robots
Vechicles
Weapons

### Categories

|  Code   | Description            |
| :-----: | ---------------------- |
| 000-000 | Accessories            |
| 000-001 | Ammunition             |
| 000-003 | Weapon Accessories     |
| 010-000 | Breathing Apparatus    |
| 020-000 | Communications Gear    |
| 030-000 | Computers              |
| 030-001 | Computer Accessories   |
| 040-000 | Construction           |
| 040-001 | Construction Materials |
| 050-000 | Drugs, Medical         |
| 060-000 | Emitters               |
| 070-000 | Explosives             |
| 080-000 | Food & Drinks          |
| 090-000 | Power Supplies         |
| 100-000 | Protections            |
| 100-001 | Armor                  |
| 100-002 | Dress                  |
| 100-003 | Suits                  |
| 100-004 | Units                  |
| 100-005 | Cyberware              |
| 110-000 | Robots                 |
| 110-001 | Automatons             |
| 110-002 | Drones                 |
| 110-003 | Strangeforms           |
| 120-000 | Sensory Aids           |
| 130-000 | Structures, Shelters   |
| 140-000 | Vehicles               |
| 140-001 | Small Craft            |
| 140-002 | Space Craft            |
| 150-000 | Weapons                |
| 150-001 | Melee                  |
| 150-002 | Blades                 |
| 150-003 | Pistols, Revolvers     |
| 150-004 | Shotguns               |
| 150-005 | Machineguns            |
| 150-006 | Rifles, Carbines       |
| 150-007 | Heavy Weapons          |
| 150-008 | Launchers              |
| 150-009 | Projectors             |
| 150-010 | Designators            |
| 150-011 | Ammunition             |
| 150-012 | Weapon Accessories     |

\* Software apparently does not have prices

_Armor Type_
Dress
Armor
Suits

Units

### Weapon Data Layout

prodId
prodType - Weapons, Protections
shortCode
longName
cost
mass
techLevel
qrebs
source
tags
wpnType - see weapon types
category ['weapons']

#### Weapon Types

1. Melee
2. Blade
3. Short Blade
4. Medium Blade
5. Long Blade
6. Heavy Weapons
7. Rifles / Carbines
8. Handguns / Revolvers
9. Shotguns
10. Designator
11. Projections
12. Launchers
13. Accessory
14. Ammunitiion

### Protections Data Layout

prodId
shortCode
longName
cost
mass
techlevel
qrebs
source
tags
protType
category ['protections']

### Protections

1. Dress
2. Armor
3. Suits
4. Units
5. Item

0
1
2
3
4
5
6
7
8
9
10 A
11 B
12 C
13 D
14 E
15 F
16 G
17 H
18 J
19 K
20 L
21 M
22 N
23 P
24 Q
25 R
26 S
27 T
28 U
29 V
30 W
31 X
32 Y
33 Z

1 010 Armor
2 020 Breathing Apparatus
3 030 Communications Gear
4 040 Computers
041 Computer Accessories
042 Programs
5 050 Construction Materials
6 060 Cyberware
7 070 Drugs
8 080 Emitters
9 090 Explosives
10 100 Food & Drinks
11 110 Medical Goods
12 120 Power Supplies
13 130 Powered Armor
14 140 Protective Gear
15 150 Robots
16 151 Automatons
17 152 Drones
18 153 Strangeforms
19 160 Sensory Aids
20 170 Shelters
21 200 Structures
22 210 Vehicles
23 180 Small Craft
24 190 Space Craft
25 220 Weapons
221 Ammunition
222 Weapon Accessories

Electronics Personal Items Robots
Communications Gear Breathing Apparatus Automatons
Computers Food & Drinks Drones
Emitters Construction Materials Robots
Power Supplies Structures Strangeforms
Programs
Sensory Aids

Medical Protections Vehicles
Cyberware Armor Vehicles
Medical Goods Protective Gear Small Craft
Drugs Construction Materials Space Craft
Shelters

Weapons
Weapons
Explosives
Power Armor
