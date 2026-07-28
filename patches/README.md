# Dependency patches

Sometimes there are problems with dependencies that can be solved by patching them. Gutenberg uses
[`patch-package`](https://www.npmjs.com/package/patch-package) to patch npm dependencies when
they're installed.

Existing patches should be described and justified here.

## Patches

### `patches/react-autosize-textarea+7.1.0.patch`

This package is unmaintained. It's incompatible with some recent versions of React types in ways
that are mostly harmless.

The `onPointerEnterCapture` and `onPointerLeaveCapture` events were removed. The package is patched
to remove those events as well.

See https://github.com/facebook/react/pull/17883.

The package also uses a way of doing default exports from a CJS package that is not compatible with
Node.js ES modules. The patch also fixes this.
