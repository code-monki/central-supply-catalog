# GitHub Pages Deployment

## Recommended Setting

Use GitHub Actions as the Pages source.

In the repository settings:

1. Open `Settings`.
2. Open `Pages`.
3. Under `Build and deployment`, set `Source` to `GitHub Actions`.

Do not set a branch or directory when using this workflow. The workflow builds the site with `npm run prod`, uploads the generated `dist/` directory as a Pages artifact, and deploys that artifact.

## Workflow

The deployment workflow is `.github/workflows/pages.yml`.

- It runs on pushes to `master`.
- It can also be run manually with `workflow_dispatch`.
- It builds static output into `dist/`.
- It uploads `dist/` with `actions/upload-pages-artifact`.
- It deploys with `actions/deploy-pages`.

## If Using Branch Deployment Instead

Branch deployment is not recommended for this project because GitHub Pages branch mode only supports publishing from the branch root or `/docs`. The Astro build output is `dist/`.

If branch deployment is required, use a separate publishing branch such as `gh-pages` and publish the contents of `dist/` to the root of that branch. Do not point Pages at `master` unless the generated site is committed at the branch root or under `/docs`.

## URL Base Path

The current site uses root-relative URLs such as `/products/...`, `/img/...`, and `/_data/...`.

This works best when GitHub Pages serves the site at a root domain, such as a custom domain or an organization/user Pages site. If the site is published as a project page under `/central-supply-catalog/`, the Astro `base` setting and internal links will need a separate pass.

