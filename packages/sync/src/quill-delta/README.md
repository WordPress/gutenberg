# quill-delta fork

## Why is this library here?

This is a fork of the `quill-delta` npm package, which is used to apply incremental text updates to `Y.Text` with `Delta` objects. We were not able to use the `quill-delta` package directly due to an internal dependency on the `fast-diff` package, which is Apache v2 licensed, and not compatible with Gutenberg and WordPress' GPLv2 license.

The `fast-diff` library in this fork has been replaced by `diff`, a different license-compatible diff implementation. Additionally, we've added the `diffWithCursor()` function to the `Delta` class that adjusts the output of `diff` to adjust calculated changes to match the user's active cursor location.

More information available in the PR: https://github.com/WordPress/gutenberg/pull/72604
