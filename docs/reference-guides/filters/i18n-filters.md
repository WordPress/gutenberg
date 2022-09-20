# i18n Filters

The i18n functions (`__()`, `_x()`, `_n()` and `_nx()`) provide translations of strings for use in your code. The values returned by these functions are filterable if you need to override them, using the following filters:

-   `i18n.gettext`
-   `i18n.gettext_with_context`
-   `i18n.ngettext`
-   `i18n.ngettext_with_context`

## Filter Arguments

The filters are passed the following arguments, in line with their PHP equivalents.

### i18n.gettext

```jsx
function i18nGettextCallback( translation, text, domain ) {
	return translation;
}
```

### i18n.gettext_with_context

```jsx
function i18nGettextWithContextCallback( translation, text, context, domain ) {
	return translation;
}
```

### i18n.ngettext

```jsx
function i18nNgettextCallback( translation, single, plural, number, domain ) {
	return translation;
}
```

### i18n.ngettext_with_context

```jsx
function i18nNgettextWithContextCallback(
	translation,
	single,
	plural,
	number,
	context,
	domain
) {
	return translation;
}
```

## Basic Example

Here is a simple example, using the `i18n.gettext` filter to override a specific translation.

```jsx
// Define our filter callback.
function myPluginGettextFilter( translation, text, domain ) {
	if ( text === 'Create Reusable block' ) {
		return 'Save to MyOrg block library';
	}
	return translation;
}

// Adding the filter
wp.hooks.addFilter(
	'i18n.gettext',
	'my-plugin/override-add-to-reusable-blocks-label',
	myPluginGettextFilter
);
```

## Using 'text domain'-specific filters

Filters that are specific to the text domain you're operating on are generally preferred for performance reasons (since your callback will only be run for strings in the relevant text domain).

To attach to a text domain-specific filter append an underscore and the text-domain to the standard filter name. For example, if filtering a string where the text domain is "woocommerce", you would use one of the following filters:

-   `i18n.gettext_woocommerce`
-   `i18n.gettext_with_context_woocommerce`
-   `i18n.ngettext_woocommerce`
-   `i18n.ngettext_with_context_woocommerce`

For example:

```jsx
// Define our filter callback.
function myPluginGettextFilter( translation, text, domain ) {
	if ( text === 'You’ve fulfilled all your orders' ) {
		return 'All packed up and ready to go. Good job!';
	}
	return translation;
}

// Adding the filter
wp.hooks.addFilter(
	'i18n.gettext_woocommerce',
	'my-plugin/override-fulfilled-all-orders-text',
	myPluginGettextFilter
);
```

_Note_: To apply a filter where the text-domain is `undefined` (for example WordPress core strings), then use the name "default" to construct the filter name.

-   `i18n.gettext_default`
-   `i18n.gettext_with_context_default`
-   `i18n.ngettext_default`
-   `i18n.ngettext_with_context_default`
