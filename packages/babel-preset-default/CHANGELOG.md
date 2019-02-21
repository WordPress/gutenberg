## 4.0.0 (Unreleased)

## Breaking Change

- Removed `babel-core` dependency acting as Babel 7 bridge ([#13922](https://github.com/WordPress/gutenberg/pull/13922). Ensure all references to `babel-core` are replaced with `@babel/core` .

## 3.0.0 (2018-09-30)

## Breaking Change

- The configured `@babel/preset-env` preset will no longer pass `useBuiltIns: 'usage'` as an option. It is therefore expected that a polyfill serve in its place, if necessary.

## 2.1.0 (2018-09-05)

### New Feature

- Plugin updated to work with the stable version of Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)).

## 2.0.0 (2018-07-12)

### Breaking Change

- Updated code to work with Babel 7 ([#7832](https://github.com/WordPress/gutenberg/pull/7832))

### Internal

- Moved `@WordPress/packages` repository to `@WordPress/gutenberg` ([#7805](https://github.com/WordPress/gutenberg/pull/7805))

## 1.3.0 (2018-05-22)

### New Feature

- Added support for async generator functions ([#126](https://github.com/WordPress/packages/pull/126))

## 1.2.1 (2018-05-18)

### Polish

- Fix: Standardized `package.json` format  ([#119](https://github.com/WordPress/packages/pull/119))
