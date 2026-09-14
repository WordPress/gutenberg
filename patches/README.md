# Dependency patches

Sometimes there are problems with dependencies that can be solved by patching them. Gutenberg uses [`npm patch`](https://docs.npmjs.com/cli/commands/npm-patch) to patch npm dependencies. Patches are registered in `patchedDependencies` in the root `package.json` and applied by npm during the install, so they work with the `linked` install strategy and `--ignore-scripts`.

To create or update a patch:

```bash
npm patch add <pkg>@<version>   # prints a directory to edit
npm patch commit <edit-dir>     # writes patches/<pkg>@<version>.patch
```

Existing patches should be described and justified here.

## Patches

### `patches/@arraypress/waveform-player@1.26.0.patch`

This patch requires initialization to be requested explicitly and removes passing custom SVG icons through HTML data attributes.
