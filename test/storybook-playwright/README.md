# Storybook Playwright Tests

This is currently set up for testing visual regressions in the `components` package. The tests do not run on CI, and is meant as a testing tool for local development.

## How to run

First, build and serve the E2E Storybook.

```sh
storybook:e2e:dev
```

You are now ready to run the tests. The first run will generate the reference images, and subsequent runs will compare against them.

```sh
npm run test:e2e:storybook
```

To update the reference images, pass the `--update-snapshots` flag.

```sh
npm run test:e2e:storybook -- --update-snapshots
```

## How to write tests

Any stories matching the ones listed in the [E2E Storybook config](./storybook/main.js) will be included in the special build. These are the fixtures for our tests.

The Playwright test files live in the [`specs`](./specs/) folder.