# Site Search

## Overview

The Central Supply Catalog site search is based upon the [minisearch](https://github.com/lucaong/minisearch) Javascript library. This library produces a small, fast index in JSON format that includes features such as fuzzy search, filters, etc. The search feature uses an index built from the product data entries and is updated when the index file is built.

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
| tags        | A collection of labels used by the Eleventy system to create custom collections            |

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

Search results will be sorted by relevance, sku, and product name.

## Unique ID Requirement

Minisearch relies upon a unique _id_ element. This element can apparently be anything so long as it is unique. The majority of the site functionality uses the sku as the unique identifier, but for the purposes of the search index, it is more reasonable to inject an artifical numeric id. The rationale is that the search index is generated to a JSON object and persisted to disk on the site. In turn the browser application must download the search index so it is desireable to minimize the size of the search index as much as possible.

With this in mind, the total number of catalog items is not anticipated to exceed 99,999 which results in a maximum of five bytes storage whereas a sku is 13 bytes every time so saving 8 bytes, while not a considerably large savings for a single retrieval becomes more important as the number of users increase. This constraint is also due to the need to minimize operational costs by minimizing the bandwidth and storage used by the application. Ergo sum, every little bit helps.

## Design

The minisearch library will be included into the web application by using the following CDN link:

```html
<script src="https://cdn.jsdelivr.net/npm/minisearch@3.0.4/dist/umd/index.min.js"></script>
```

Should the CDN link fail at some point in the future, the libraries will be installed locally in the _src/js_ directory and deployed as part of the site.

The resulting search index will be stored in the \data folder as an uncompressed text file containing a JSON array. The file is not be compressed as the underlying assumption is that the Github Pages web server has compression turned on.

The input data for the index is stored in a collection of files in the \data directory that will not be copied to the production \data folder. The _products-manifest.json_ file contains a list of the data files for the indexer to use as its input.

The search results will be overlaid on the home page in place of the departments container.

Each product result will have the same layout that is used by the product display for the department page. This will include the following elements:

- Product Image
- Product Name (as a hyperlink to the product page)
- Product Summary
- Product Cost

The search results will provide a pagination feature should the number of results exceed 8. The results will be organized into groups of 8 on large/x-large screens, 3 on tablets, 2 on mobile phones.

The search index will be retrieved by the application and cached in a custom browser application cache. All subsequent calls to retrieve the index will go against the cache. When new content is added, the old cache will be deleted and will be replaced with a new cache. This approach uses a service worker to load the index when the user goes to the site. If the cache is still valid, the call to retrieve the index will go against the application cache. Otherwise, the service worker will retrieve the index from the site and store it in the application cache.

## Search Term Parser

Minisearch has recently added the ability to do compound searches. To support this capability the search terms will need to be parsed into the appropriate abstract-syntax tree (AST) structure. The parser will support the following grammar:

| Term         | Description                                | Example                        |
| ------------ | ------------------------------------------ | ------------------------------ |
| <word>       | Single word search term                    | torch                          |
| <list>       | List of words - defaults to logical OR     | welding torch                  |
| <compound>   | Combination of words and logical groupings | (cutting or welding) and torch |
| <logicalOr>  | List of words searched with a logical OR   | (cutting or welding)           |
| <logicalAnd> | List of words searched with a logical AND  | (welding and torch)            |

---

## Project Decision (2 Oct 2021)

For the purposes of getting the site live, the complex search logic will be postponed to the next release.

Notes:

From search bar, treat everything as query parameters
Add filters entry in menu
When user click submit button, resubmit search with filter parameters
