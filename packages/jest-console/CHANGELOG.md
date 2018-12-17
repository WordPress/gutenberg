## 2.0.7 (2018-11-20)

## 2.0.5 (2018-09-30)

### Bug Fixes

- Captures and protects against unexpected console logging occurring during lifecycle.

## 2.0.0 (2018-07-12)

### Breaking Change

- Add new API methods `toHaveInformed`, `toHaveInformedWith`, `toHaveLogged` and `toHaveLoggedWith` ([#137](https://github.com/WordPress/packages/pull/137)). If the code under test calls `console.log` or `console.info` it will fail, unless one of the newly introduced methods is explicitly used to verify it.
- Updated code to work with Babel 7 ([#7832](https://github.com/WordPress/gutenberg/pull/7832))

### Internal

- Moved `@WordPress/packages` repository to `@WordPress/gutenberg` ([#7805](https://github.com/WordPress/gutenberg/pull/7805))

## 1.0.7 (2018-05-18)

### Polish

- Fix: Standardized `package.json` format ([#119](https://github.com/WordPress/packages/pull/119))

## 1.0.6 (2018-02-28)

### Polish

- Removed `package-lock.json` file, lockfiles for apps, not packages ([#88](https://github.com/WordPress/packages/pull/88))
