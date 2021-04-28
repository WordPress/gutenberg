<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

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

-   Remove unneccessary argument from an instance of `Array#pop`.

## 1.0.0 (2019-03-06)

-   Initial release
