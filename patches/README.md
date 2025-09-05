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

The mobile editor relies upon `jsdom-jscore-rn` to create a partial DOM
environment, which causes `react-devtools-core` to believe it's running in a
browser environment. We added a custom conditional to disable browser-specific
features when running in a `jsdom-jscore-rn` environment.

See https://github.com/WordPress/gutenberg/pull/47616.

### `patches/react-native+0.73.3.patch`

Accessibility changes in React Native 0.73.0 resulted in a broken braille screen
input on iOS. This patch is a workaround to restore the previous behavior.

See https://github.com/WordPress/gutenberg/pull/53895.
