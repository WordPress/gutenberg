# Require a number placeholder in plural translatable strings (i18n-plural-placeholder)

`_n()` and `_nx()` choose a plural form from a number, and many languages use the same form for more than one number. Russian, Ukrainian, Serbian, and Croatian, for example, use the form for 1 also for 21, 31, and 101. A singular string that does not show the number, such as "This block", then reads wrong for those numbers.

This rule reports `_n()` and `_nx()` calls where neither the singular nor the plural string contains a placeholder. A self-closing element tag with any name, such as `<BlockCount />`, counts as a placeholder, because `createInterpolateElement` can replace it with the number.

If the strings are not meant to show the number, choose between two separate strings with an explicit check instead. See [Basic Pluralization](https://developer.wordpress.org/plugins/internationalization/how-to-internationalize-your-plugin/#basic-pluralization) in the WordPress Plugin Handbook.

## Rule details

Examples of **incorrect** code for this rule:

```js
_n( 'This block', 'These blocks', count );
```

Examples of **correct** code for this rule:

```js
sprintf( _n( '%d block', '%d blocks', count ), count );
1 === count ? __( 'This block' ) : __( 'These blocks' );
```
