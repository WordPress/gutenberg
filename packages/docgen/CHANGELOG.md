<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 1.59.0 (2024-01-24)

## 1.58.0 (2024-01-10)

## 1.57.0 (2023-12-13)

## 1.56.0 (2023-11-29)

## 1.55.0 (2023-11-16)

## 1.54.0 (2023-11-02)

## 1.53.0 (2023-10-18)

## 1.52.0 (2023-10-05)

## 1.51.0 (2023-09-20)

## 1.50.0 (2023-08-31)

## 1.49.0 (2023-08-16)

## 1.48.0 (2023-08-10)

## 1.47.0 (2023-07-20)

## 1.46.0 (2023-07-05)

## 1.45.0 (2023-06-23)

## 1.44.0 (2023-06-07)

## 1.43.0 (2023-05-24)

## 1.42.0 (2023-05-10)

## 1.41.0 (2023-04-26)

## 1.40.0 (2023-04-12)

## 1.39.0 (2023-03-29)

## 1.38.0 (2023-03-15)

## 1.37.0 (2023-03-01)

## 1.36.0 (2023-02-15)

## 1.35.0 (2023-02-01)

## 1.34.0 (2023-01-11)

## 1.33.0 (2023-01-02)

## 1.32.0 (2022-12-14)

## 1.31.0 (2022-11-16)

## 1.30.0 (2022-11-02)

## 1.29.0 (2022-10-19)

## 1.28.0 (2022-10-05)

## 1.27.0 (2022-09-21)

## 1.18.0 (2021-07-21)

### Bug Fixes

-	Fix getting param annotations for default exported functions. ([#31603](https://github.com/WordPress/gutenberg/pull/31603))

## 1.17.0 (2021-04-29)

### New Features

-   Add support for array and object destructured arguments in TypeScript documentation generation.
-   Add support for default arguments in TypeScript.
-   Add support for static non-function variable type extraction in TypeScript.

## 1.16.0 (2021-03-17)

-   Replace deprecated `doctrine` parser with simpler `comment-parser` to support a wider variety of types. This also de-normalizes types such that types will be transcribed exactly as they are declared in the doc comments.
-   Add support for TypeScript type annotations by using the TypeScript plugin for babel. This allows docgen to extract explicitly annotated types from exported functions and variables. It is _not_ able to consume inferred types.

## 1.7.0 (2020-02-04)

### Bug Fixes

-   The built-in Markdown formatter will output text indicating that the type is unknown if a type cannot be parsed. Previously, these would be output wrongly as the `null` type.

## 1.3.0 (2019-08-05)

### Bug Fixes

-   Docblocks with CRLF endings are now parsed correctly.

## 1.2.0 (2019-05-21)

### Enhancement

-   Docblocks including a `@private` tag will be omitted from the generated result.

### Internal

-   Remove unnecessary argument from an instance of `Array#pop`.

## 1.0.0 (2019-03-06)

-   Initial release
