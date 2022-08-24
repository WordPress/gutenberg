# Storybook Playwright Tests

This is currently set up for testing visual regressions in the `components` package. The tests do not run on CI, and is meant as a testing tool for local development.

## How to run

First, prepare a static build of the Storybook. This is required to generate the `stories.json` file, which contains metadata for every story.

```sh
npm run storybook:build
```

Then serve the Storybook locally, using either the static build prepared in the previous step, or the dev server if you want to iterate in watch mode.

```sh
# Using the static build
npx http-server storybook/build -p 50240

# Using the dev server
npm run storybook:dev
```

You are now ready to run the tests. The first run will generate the reference images, and subsequent runs will compare against them.

```sh
npm run test:e2e:storybook
```

To update the reference images, pass the `--update-snapshots` flag.

```sh
npm run test:e2e:storybook -- --update-snapshots
```