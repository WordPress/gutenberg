# Disallow collapsible whitespace in translatable strings (i18n-no-collapsible-whitespace)

Using complex whitespace in translatable strings and relying on HTML to collapse it can make translation more difficult and lead to unnecessary retranslation.

Whitespace can be appropriate in longer translatable content, for example a whole blog post. These cases are unlikely to occur in the code scanned by eslint but if they do, [disable the rule with inline comments](http://eslint.org/docs/user-guide/configuring#disabling-rules-with-inline-comments. ( e.g. `// eslint-disable-line i18n-no-collapsible-whitespace` ).

## Rule details

Examples of **incorrect** code for this rule:

```js
__( 'A string\non two lines' );
__( 'A string\non two lines' );
__( `A string
on two lines` );
__( `A	string	with	tabs` );
__( "Multiple spaces.  Even after a full stop.  (We're going there)" );
```

Examples of **correct** code for this rule:

```js
__( `A long string ` + `spread over ` + `multiple lines.` );
```
