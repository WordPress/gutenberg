# Avoid unguarded getRangeAt (no-unguarded-get-range-at)

Some browsers (e.g. Safari) will throw an error when `getRangeAt` is called and there are no ranges in the selection.

## Rule details

Example of **incorrect** code for this rule:

```js
window.getSelection().getRangeAt( 0 );
```

Example of **correct** code for this rule:

```js
const selection = window.getSelection();
const range = selection.rangeCount ? selection.getRangeAt( 0 ) : null;
```
