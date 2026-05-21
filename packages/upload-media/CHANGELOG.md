<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### Bug Fix

- Fix `-scaled` suffix propagating to every sub-size filename when an image exceeds `big_image_size_threshold`. Threshold scaling now runs as a sideload after the original is uploaded, so sub-sizes inherit the un-suffixed basename — matching WordPress core's `wp_create_image_subsizes()` naming.
- Propagate the post-finalize attachment from `mediaFinalize` back to the queue so the block markup picks up the `-scaled` URL. Without this, oversized client-side uploads kept the unscaled original's URL in the block, and `wp_calculate_image_srcset()` could not match the `src` to any entry in `$image_meta['sizes']` — so the front-end `<img>` shipped without `srcset`.

## 0.31.0 (2026-05-14)

## 0.30.0 (2026-04-29)

### Enhancement

- Remove sideload upload serialization: thumbnail uploads now run concurrently, governed by `maxConcurrentUploads` instead of being queued one-at-a-time per attachment ([#75257](https://github.com/WordPress/gutenberg/pull/75257)).

## 0.29.0 (2026-04-15)

## 0.28.0 (2026-04-01)

## 0.27.0 (2026-03-18)

## 0.26.0 (2026-03-04)

## 0.25.0 (2026-02-18)

## 0.24.0 (2026-01-29)

## 0.23.0 (2026-01-16)

## 0.21.0 (2025-11-26)

## 0.20.0 (2025-11-12)

## 0.19.0 (2025-10-29)

## 0.18.0 (2025-10-17)

## 0.17.0 (2025-10-01)

## 0.16.0 (2025-09-17)

## 0.15.0 (2025-09-03)

## 0.14.0 (2025-08-20)

## 0.13.0 (2025-08-07)

## 0.12.0 (2025-07-23)

## 0.11.0 (2025-06-25)

## 0.10.0 (2025-06-04)

## 0.9.0 (2025-05-22)

## 0.8.0 (2025-05-07)

## 0.7.0 (2025-04-11)

## 0.6.0 (2025-03-27)

## 0.5.0 (2025-03-13)

## 0.4.0 (2025-02-28)

## 0.3.0 (2025-02-12)

## 0.2.0 (2025-01-29)

## 0.1.0 (2025-01-15)

Initial release.
