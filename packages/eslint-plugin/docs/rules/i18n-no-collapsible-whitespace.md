# Disallow collapsible whitespace in translatable strings. (i18n-no-collapsible-whitespace)

Translatable strings that consist of nothing but a placeholder are rather pointless and not really translatable.

## Rule details

Examples of **incorrect** code for this rule:

```js
__( '%s' );
```

Examples of **correct** code for this rule:

```js
__( 'Hello %s' );
```
