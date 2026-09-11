# Dependency patches

Sometimes there are problems with dependencies that can be solved by patching them. Patches live in
this directory and are applied on `postinstall` by
[`tools/monorepo/patch`](../tools/monorepo/patch), which knows how to find packages
in the `node_modules/.store/` layout the `linked` install strategy uses.

Existing patches should be described and justified here.

## Patches

### `patches/@arraypress+waveform-player+1.26.0.patch`

This patch requires initialization to be requested explicitly and removes passing custom SVG icons
through HTML data attributes.
