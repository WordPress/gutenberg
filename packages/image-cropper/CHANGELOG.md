<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### New Features

-   Add `Cropper`, `useCropperController`, `CropperProvider` and `useCropper`: the cropper the media editor uses, with pan, zoom, rotation, flip and a resizable crop area. Also add `buildModifiers`, which turns a crop into the instructions the WordPress media REST endpoint expects, helpers for where the crop lands in the source image, and `useCropSession`, which adds undo and redo, gesture boundaries and aspect-ratio presets. This API is experimental. Its styles ship in `build-style/style.css`.

### Deprecations

-   `ImageCropper`, `ImageCropperProvider`, `useImageCropper` and `normalizeRotation` are deprecated. Use `Cropper` instead.

### Internal

-   Stop publishing stories and tests, and move `@wordpress/components` to development dependencies, since only the stories use it.

## 2.0.0 (2026-10-20)

### Breaking Changes

-   Raise the minimum required Node.js version to `>=22.13.0`, for stable `require(esm)` support ([#84313](https://github.com/WordPress/gutenberg/pull/84313)).

## 1.21.0 (2026-10-07)

## 1.20.0 (2026-09-23)

## 1.19.0 (2026-09-10)

### Internal

-   Remove unused dependency `clsx` ([#82103](https://github.com/WordPress/gutenberg/pull/82103)).

## 1.18.0 (2026-08-26)

### Internal

-   Split tsconfig into a build project and a default dev project so dev files are type checked without publishing their declarations. ([#81516](https://github.com/WordPress/gutenberg/pull/81516))

## 1.17.0 (2026-08-12)

## 1.16.0 (2026-07-29)

## 1.15.0 (2026-07-14)

### Enhancements

-   Widen React peer dependency ranges to `^18 || ^19` to support both React 18 and React 19 environments ([#80024](https://github.com/WordPress/gutenberg/pull/80024)).

## 1.14.0 (2026-07-01)

## 1.13.0 (2026-06-24)

## 1.12.1 (2026-06-16)

## 1.12.0 (2026-06-10)

### Code Quality

-   Add missing `@types/react` dependency. [#78882](https://github.com/WordPress/gutenberg/pull/78882).

## 1.11.0 (2026-05-27)

## 1.10.0 (2026-05-14)

## 1.9.0 (2026-04-29)

## 1.8.0 (2026-04-15)

## 1.7.0 (2026-04-01)

## 1.6.0 (2026-03-18)

## 1.5.0 (2026-03-04)

## 1.4.0 (2026-02-18)

## 1.3.0 (2026-01-29)

## 1.2.0 (2026-01-16)
