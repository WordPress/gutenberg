# Require ordered placeholders in translatable strings with more than one placeholder (i18n-ordered-placeholders)

Translators often need to change the order of the values in a sentence, because other languages order words differently. With unordered placeholders such as `%s`, the values are always inserted in the order of the `sprintf()` arguments, so translators cannot reorder them. With ordered placeholders such as `%1$s` and `%2$s`, they can.

This rule reports translatable strings that contain more than one placeholder, where any of them is unordered. Named placeholders such as `%(name)s` count as ordered. Strings where every placeholder is unordered are fixed automatically by numbering the placeholders in the order they appear. Update the translator comment to match.

## Rule details

Examples of **incorrect** code for this rule:

```js
__( '%s of %s' );
_n( '%d block in %s', '%d blocks in %s', count );
__( '%1$s of %s' );
```

Examples of **correct** code for this rule:

```js
__( '%1$s of %2$s' );
_n( '%1$d block in %2$s', '%1$d blocks in %2$s', count );
__( '%(current)s of %(total)s' );
__( 'Hello %s' );
```
