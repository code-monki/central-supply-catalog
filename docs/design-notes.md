# Design Notes

## Overview

This document contains notes related to the design and implementation of the Central Supply Catalog.

## Licensing Issues

### Open Game License

The Cepheus Engine fallsd under the Open Game License (OGL) version 1.0a. This license requires that all OGL content be identified as such and in a manner that it can be easily identified. Given the nature of the OGL content that will be used, i.e., the descriptions and characterists of goods, each item will have an associate entry indicating the source of the entry in the data files.

### Traveller

Marc Miller has generously given his approval and support for the project and volunteered to send images.

### Traveller Wiki

The Traveller Wiki Stewards have been reached out to but have yet to respond.

### Individual Authors

The process to contact individual authors is underway and their content will be added upon receiving approval to do so.

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
