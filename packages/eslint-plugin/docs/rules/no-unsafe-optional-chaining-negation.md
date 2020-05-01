# Avoid unsafe optional chaining negation (no-unsafe-optional-chaining-negation)

Negating the result of an [optional chaining expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining) is likely to produce an unexpected `true` value if the expression short-circuits on a nullish value.

The following code would would evaluate to `true` if there is no active (focused) element, which is most likely not the expected result:

```js
const hasEnabledFocus = ! document.activeElement?.disabled;
```

## Rule details

Example of **incorrect** code for this rule:

```js
const hasEnabledFocus = ! document.activeElement?.disabled;
```

Example of **correct** code for this rule:

```js
const hasEnabledFocus = document.activeElement && ! document.activeElement.disabled;
```
