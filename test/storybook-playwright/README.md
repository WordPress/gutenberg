# Storybook Playwright Tests

This is currently set up for testing visual regressions in the `components` package. The tests do not run on CI, and is meant as a testing tool for local development.

## How to run

First, build and serve the E2E Storybook.

```sh
npm run storybook:e2e:dev
```

You are now ready to run the tests. The first run will generate the reference images, and subsequent runs will compare against them. (On the first run, you may be prompted to first install Playwright. If so, follow the instructions.)

```sh
npm run test:e2e:storybook
```

To update the reference images, pass the `--update-snapshots` flag.

```sh
npm run test:e2e:storybook -- --update-snapshots
```

## How to write tests

Any stories matching the glob patterns listed in the [E2E Storybook config](./storybook/main.js) will be included in the special build. Note that these are exclusive fixtures for our tests, and are separate from the stories included in the [main Storybook build](../../storybook/main.js) to be [published online](https://wordpress.github.io/gutenberg/).

The Playwright test files live in the [`specs`](./specs/) folder. See the [E2E Tests README](../e2e/README.md) for general best practices.