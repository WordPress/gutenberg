# Disallow flanking whitespace in translatable strings (i18n-no-flanking-whitespace)

Using flanking whitespace in translatable strings unintentionally or for layout purposes can make translation more difficult and lead to unnecessary retranslation. Unnecessary whitespace may also cause issues in the translation pipeline.

## Rule details

Examples of **incorrect** code for this rule:

```js
__( ' A string with a leading space.' );
__( 'A string with a trailing space. ' );
__( ' A string with flanking spaces. ' );
__( '\tA string with a leading tab.' );
__( 'A string with an empty newline\n' );
```

Examples of **correct** code for this rule:

```js
__( 'A string with no leading or trailing spaces or tabs.' );
```
