# Central Supply Catalog

The Central Supply Catalog (CSC) provides an online catalog of equipment and supplies for the Cepheus Engine and Traveller Science Fiction Role-Playing Games (SFRPG). The catalog is a living resource and allows new entries to be submitted via pull requests. The CSC is hosted on Netlify and is a free resource for the community.


## Cepheus Engine

“Cepheus Engine” and “Samardan Press” are the trademarks of Jason "Flynn" Kemp. The author is not associated with Samardan Press nor Jason “Flynn” Kemp.

You may view a complete copy of the Cepheus Engine SRD by clicking this <a href="https://thetrove.is/Books/Cepheus%20Engine/CE%20-%20Cepheus%20Engine%20SRD.pdf" target="_blank">link</a>.

## Far Future Enterprises

Some catalog content is based on Traveller 5 material and is used with permission from Marc Miller / Far Future Enterprises.

## Mongoose Publishing

The Traveller game in all forms is owned by <a href="https://mongoosepublishing.com" target="_blank">Mongoose Publishing Ltd.</a>. Copyright 1977 - 2026 Mongoose Publishing Ltd. Traveller is a registered trademark of Mongoose Publishing, Ltd. Mongoose Publishing permits web sites and fanzines for this game, provided it contains this notice, that Mongoose Publishing is notified, and subject to a withdrawal of permission on 90 days notice. The contents of this site are for personal, non-commercial use only.

Any use of Mongoose Publishing's copyrighted material or trademarks anywhere on this web site and its files should not be viewed as a challenge to those copyrights or trademarks. In addition, any program/articles/file on this site cannot be republished or distributed without the consent of the author who contributed it.

## Traveller Wiki

The stewards of the <a href="https://wiki.travellerrpg.com/" target="_blank">Traveller Wiki</a> have graciously agreed to share wiki content with this application and the author of the application has agreed to reciprocate with new content that augments the Traveller Wiki. Traveller Wiki content may be subject to Creative Commons Attribution-NonCommercial 3.0 Unported terms, separate publisher permissions, or other contributor/publisher restrictions. This is a wonderful resource for referees and players for any version of Traveller.

## Open Gaming License

A portion of the content is governed by the <a href="https://www.d20srd.org/ogl.htm" target="_blank">Open Gaming License v1.0a.</a> As such the author has attempted to make a reasonable effort to ensure compliance with that license for those materials that fall under it.

## Contributions

Contributions are welcome with the understanding that the contributor grants permission for the content to be used on the site. Proper attribution will appear in the data files. See the [wiki](https://github.com/cmcknight/central-supply-catalog/wiki) for this project for information.

## Development

The site is built with Astro and Vue islands. See [docs/system.md](docs/system.md) for architecture, data flow, routing, search, cart storage, service worker behavior, and validation details.

Common commands:

```bash
npm ci
npm run test:install
npm run prod
npm run preview -- --host 127.0.0.1 --port 4324
npm test
npm run test:audit
```

`npm test` runs Playwright browser regressions and axe accessibility checks. `npm run test:audit` runs desktop Lighthouse budgets against sampled production-preview routes.

## Licensing

The source code is licensed under the Apache License, Version 2.0. See [LICENSE-CODE.md](LICENSE-CODE.md).

Catalog data, product descriptions, images, setting references, and other Traveller-related content are licensed or used separately under the terms described in [LICENSE-CONTENT.md](LICENSE-CONTENT.md) and [NOTICE.md](NOTICE.md). The Apache-2.0 code license does not grant rights to Traveller content, trademarks, images, or other third-party material.
