# Disallow translatable strings wrapped in a single HTML element (i18n-no-html-wrapped-strings)

When a whole translatable string is wrapped in an HTML element, the element is not part of the text, and translators have to copy it into every translation without making a mistake. Move the element outside of the translatable string instead.

This rule reports translatable strings that consist of a single element, including elements replaced by `createInterpolateElement()`. As in the `WordPress.WP.I18n.NoHtmlWrappedStrings` check of the WordPress Coding Standards for PHP, strings are not reported when the element has a placeholder in an attribute, or when it is a link with an `href` attribute, because the link target may need to be localized. Strings are also not reported when the element has text in an attribute that users read or hear, such as `title`, `alt`, or `aria-label`, because that text needs translating with the content.

## Rule details

Examples of **incorrect** code for this rule:

```js
__( '<strong>Warning</strong>' );
__( '<p class="notice">Text with <em>emphasis</em>.</p>' );
createInterpolateElement( __( '<a>Learn more</a>' ), {
	a: <ExternalLink href={ url } />,
} );
```

Examples of **correct** code for this rule:

```js
<strong>{ __( 'Warning' ) }</strong>;
__( '<strong>Note:</strong> This cannot be undone.' );
__( '<a href="https://wordpress.org/">WordPress</a>' );
__( '<abbr title="Coordinated Universal Time">UTC</abbr>' );
<ExternalLink href={ url }>{ __( 'Learn more' ) }</ExternalLink>;
```
