# Dependency patches

Sometimes there are problems with dependencies that can be solved by patching them. Gutenberg uses
[`patch-package`](https://www.npmjs.com/package/patch-package) to patch npm dependencies when
they're installed.

Existing patches should be described and justified here.

## Patches

### `patches/@arraypress+waveform-player+1.26.0.patch`

This patch requires initialization to be requested explicitly and removes passing custom SVG icons
through HTML data attributes.
