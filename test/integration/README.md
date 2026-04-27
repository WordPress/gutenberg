# Integration Tests

This directory contains the integration test suite for the Gutenberg project.
These tests live in the internal `@wordpress/integration-tests` workspace package, which is private and not published.

## What Are Integration Tests?

Unlike unit tests that test individual functions in isolation, these tests exercise multiple packages working together. They cover:

| Test file | What it tests |
|---|---|
| `blocks-schema.test.js` | Validates all `block.json` files in the repo against the JSON schema |
| `theme-schema.test.js` | Validates all `theme.json` files in the repo against the JSON schema |
| `wp-env-schema.test.js` | Validates `.wp-env.json` against the JSON schema |
| `blocks-raw-handling.test.js` | Tests raw paste/HTML handling across the full block pipeline |
| `full-content/full-content.test.js` | Tests full block serialization round-trips using fixtures |
| `is-valid-block.test.js` | Tests block validation with editor hooks applied |
| `shortcode-converter.test.js` | Tests shortcode-to-block conversion |
| `non-matched-tags-handling.test.js` | Tests handling of unrecognized HTML tags during paste |

## Running the Tests

Integration tests run as part of the standard unit test command:

```bash
npm run test:unit
```

To run only the integration tests:

```bash
npm run test:unit -- test/integration
```

To run a specific integration test file:

```bash
npm run test:unit -- test/integration/blocks-schema.test.js
```

## Fixtures

The `fixtures/blocks/` directory contains serialized block fixtures used by `full-content.test.js` to verify that blocks serialize and parse correctly.

To generate missing fixtures:

```bash
npm run fixtures:generate
```

To regenerate all fixtures from scratch:

```bash
npm run fixtures:regenerate
```

## Jest Configuration

These tests reuse the Jest configuration from `test/unit/jest.config.js`. There is no separate Jest config in this directory — `test/unit`'s config sets `rootDir` to the repo root, which automatically discovers tests in this directory.
