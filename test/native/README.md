# Native Tests

This package contains Jest-based native (React Native) tests for Gutenberg.

It runs as the internal workspace package `@wordpress/native-tests` and is wired to the root scripts so tests can be run from the repository root.

## Scope

This suite covers native-facing test scenarios, including:

- Native integration tests under `test/native/integration`.
- Native test files across the repo matched by the native Jest config.
- React Native package tests such as `packages/react-native-*/**/?(*.)+(spec|test).[jt]s?(x)`.

### Test file patterns

By default, this package runs tests matching:

- `test/**/*.native.[jt]s?(x)`
- `**/test/!(helper)*.native.[jt]s?(x)`
- `packages/react-native-*/**/?(*.)+(spec|test).[jt]s?(x)`

See `test/native/jest.config.js` for the full and current source of truth.

## Run tests

From the repository root:

```bash
npm run test:native
```

Run in watch mode:

```bash
npm run test:native:watch
```

Run a specific file or directory:

```bash
npm run test:native -- test/native/integration/editor-history.native.js
```

```bash
npm run test:native -- packages/react-native-editor/src/components
```

Run by test name:

```bash
npm run test:native -- --testNamePattern="history"
```

## Useful scripts

- `npm run test:native:debug`: run in band with verbose output.
- `npm run test:native:update`: update snapshots.
- `npm run test:native:clean`: clear Jest cache used by native tests.
- `npm run test:native:perf`: run native performance tests with Reassure.
- `npm run test:native:perf:baseline`: record/update Reassure baseline.

## Select React Native platform

The native Jest config supports platform selection via `TEST_RN_PLATFORM`.

Default platform is `android`. To run with `ios` behavior:

```bash
TEST_RN_PLATFORM=ios npm run test:native
```

## Snapshots

Native snapshots are committed in `__snapshots__` folders next to tests.

When behavior changes intentionally, update snapshots with:

```bash
npm run test:native:update
```

## Test helpers

Use helpers from `test/native/helpers.js` in native tests. This re-exports:

- `@testing-library/react-native`
- `measurePerformance` from Reassure
- Native integration test helpers from `test/native/integration-test-helpers`

See `test/native/integration-test-helpers/README.md` for helper details.
