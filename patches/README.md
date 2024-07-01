# Dependency patches

Sometimes there are problems with dependencies that can be solved by patching them. Gutenberg uses
[`patch-package`](https://www.npmjs.com/package/patch-package) to patch npm dependencies when
they're installed.

Existing patches should be described and justified here.

## Patches

### `patches/lighthouse+10.4.0.patch`

No notes.

### `patches/react-autosize-textarea+7.1.0.patch`

This package is unmaintained. It's incompatible with some recent versions of React types in ways
that are mostly harmless.

The `onPointerEnterCapture` and `onPointerLeaveCapture` events were removed. The package is patched
to remove those events as well.

See https://github.com/facebook/react/pull/17883.

### `patches/react-devtools-core+4.28.5.patch`

No notes.

### `patches/react-native+0.73.3.patch`

No notes.

### `patches/postcss-urlrebase+1.3.0.patch`

This package uses a `URL` global value but imports the Node.js `URL` type. Remove the
Node.js-specific type import to use the global URL type available in both browsers and Node.js.

This fixes a type issue where some Gutenberg packages use postcss in the browser.
