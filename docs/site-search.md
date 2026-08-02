# Site Search

## Overview

The Central Supply Catalog site search uses a generated product payload and a purpose-built browser-side query parser. Search is intended to find catalog records that match the terms, phrases, and boolean operators entered by the user rather than broad related records.

## Requirements

### Functional Requirements

[Func1] Provide a full-text search capability
[Func2] Provide the capability to display the search results
[Func3] Provide the capability to paginate the search results display
[Func4] Provide the capability to persist the search index locally
[Func5] Provide the capability to update the search index when it is changed on the server
[Func6] Provide the capability for the user to force a refresh of the search index
[Func7] Provide the capability to filter search results.

# Analysis

The product data entries consist of the following format:

| Element     | Description                                                                                |
| ----------- | ------------------------------------------------------------------------------------------ |
| sku         | Unique identifier for element.                                                             |
| category    | The category of the product                                                                |
| type        | The type of the product. Often this will be the same as the category                       |
| subtype     | A further definition of the type of product                                                |
| name        | The name of the product                                                                    |
| cost        | The cost of the product                                                                    |
| mass        | The mass of the product in kilograms                                                       |
| size        | the size of the object                                                                     |
| techLevel   | The initial technology level where the product becomes available                           |
| qrebs       | The measure of **Q**uality, **R**eliability, **E**ase of Use, **B**urden, and **S**afety   |
| image       | url of image file                                                                          |
| description | Full-text description of item                                                              |
| sources     | A collection of objects that provide the author / publication attributions for the product |
| accessories | A collection of skus to related products                                                   |
| tags        | A collection of labels used for search and catalog grouping                                |

For the purposes of the search index, the relevant fields to include in the index are:

- sku
- category
- type
- subtype
- name
- description
- cost
- mass
- size
- techLevel
- qrebs
- tags

The display will require the following fields:

- sku
- name
- description
- cost

The following fields are used for filtering:

- category
- type
- subtype
- cost
- mass
- size
- techLevel
- qrebs
- tags

Search results are sorted by relevance, product name, and sku. Relevance prioritizes product-name phrase matches, product-name term matches, and then summary/description matches.

## Design

The browser-side search implementation lives in `astro/lib/catalogSearch.mjs` and is bundled into the Astro search component by Vite. The Astro build emits the search payload at `/_data/searchindex.json`.

The resulting search payload is stored at `/_data/searchindex.json` as uncompressed JSON. It contains a version and document array; the browser evaluates queries against those documents and caches the documents in `localStorage` by version.

The input data for the index is stored in `src/_data/products/` and is not copied directly to the production `_data` folder.

The search results will be overlaid on the home page in place of the departments container.

Each product result will have the same layout that is used by the product display for the department page. This will include the following elements:

- Product Image
- Product Name (as a hyperlink to the product page)
- Product Summary
- Product Cost

The search payload is retrieved by the application and cached in `localStorage` using a versioned key. When new content is added, the version changes and stale cache entries are removed.

## Search Term Parser

The query parser supports the following grammar:

| Term         | Description                                | Example                        |
| ------------ | ------------------------------------------ | ------------------------------ |
| <word>       | Single word search term                    | torch                          |
| <phrase>     | Exact phrase surrounded by double quotes   | "laser pistol"                 |
| <list>       | List of words - defaults to logical AND    | welding torch                  |
| <compound>   | Combination of words and logical groupings | (cutting or welding) and torch |
| <logicalOr>  | List of words searched with a logical OR   | (cutting or welding)           |
| <logicalAnd> | List of words searched with a logical AND  | (welding and torch)            |
| <logicalNot> | Excludes records that match a term         | laser not rifle                |

Search operators are case-insensitive. Adjacent terms without an explicit operator are treated as `AND`. Terms match normalized product tokens, including prefix matches. Quoted phrases match adjacent words in normalized product fields.

Examples:

- `laser pistol` finds records containing both `laser` and `pistol`.
- `"laser pistol"` finds records containing the exact phrase `laser pistol`.
- `laser OR maser` finds records containing either term.
- `laser NOT rifle` finds records containing `laser` but not `rifle`.
- `(laser OR maser) AND pistol` finds pistol records that also contain either `laser` or `maser`.
