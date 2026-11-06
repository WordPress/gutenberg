<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### Breaking Changes

-   Rebuild the package on `@wordpress/image-editor` and remove the `react-easy-crop` and `dequal` dependencies. `ImageCropper`, `ImageCropperProvider`, `useImageCropper` and `normalizeRotation` keep their names and shapes ([#86407](https://github.com/WordPress/gutenberg/pull/86407)).
-   Consumers load the package's stylesheet, `build-style/style.css`, from Sass or JavaScript. The old library injected its own styles ([#86407](https://github.com/WordPress/gutenberg/pull/86407)).
-   `cropperState.crop` is the image editor's pan, in fractions of the image, instead of a pixel offset of the image ([#86407](https://github.com/WordPress/gutenberg/pull/86407)).
-   `croppedArea` and `croppedAreaPixels` are measured after the flip, then after a clockwise rotation of `rotation` degrees, or of `360 - rotation` degrees when exactly one axis is flipped. The old values were in the unflipped frame ([#86407](https://github.com/WordPress/gutenberg/pull/86407)).
-   `mediaSize.width` and `mediaSize.height` equal the natural size ([#86407](https://github.com/WordPress/gutenberg/pull/86407)).
-   `getCroppedImage` ignores its argument and exports the loaded image ([#86407](https://github.com/WordPress/gutenberg/pull/86407)).
-   A `crop` region in `setResetState` is ignored; zoom, rotation, aspect ratio and flip apply ([#86407](https://github.com/WordPress/gutenberg/pull/86407)).
-   `minZoom` is accepted and ignored. Zoom is clamped by the editor, with the component's `maxZoom` default of 5 ([#86407](https://github.com/WordPress/gutenberg/pull/86407)).
-   A rotated image refits the view on its own. Small crops are magnified on screen, up to 8x, and keep a 44px minimum size ([#86407](https://github.com/WordPress/gutenberg/pull/86407)).
-   The `reactEasyCrop_*`, `image-cropper__crop-area` and `image-cropper__image` class names are gone, and extra props are no longer forwarded to the underlying component ([#86407](https://github.com/WordPress/gutenberg/pull/86407)).

### Deprecations

-   Deprecate the package in favour of `@wordpress/image-editor`. Mounting `ImageCropperProvider` logs a notice ([#86407](https://github.com/WordPress/gutenberg/pull/86407)).

## 2.1.0 (2026-11-04)

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
