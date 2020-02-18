# Link Control

`<LinkControl>` is a component designed to provide a standardized UI for the
creation of hyperlinks within the Editor.


## History

Much of the context for this component
can be found in [the original Issue](https://github.com/WordPress/gutenberg/issues/17557).

Previously iterations of a hyperlink UI existed within the Gutenberg interface
but these tended to be highly tailored to their individual use cases and were
not standardised, each having their own implementation.

These older UIs tended to make use of two existing components: `URLInput` and
`URLPopover`. When a requirement was raised to implement a new UI for hyperlink
creation, an assessment of these existing components was undertaken and it was
determined that they were too opinionated as to be easily refactored to
accommodate the new use cases required by the new UI. Attempting to do so would
also have meant unavoidable breaking changes to the interface of `URLInput`
which would have (most probably) caused breaking changes to ripple across not
only the Core codebase, but also that of 3rd party Plugins.

As a result, it was agreed that a new component `LinkControl` would be created
to realise the new hyperlink creation interface. This new UI would begin life as
an experimental component which would consume `URLInput` internally. The API of
`URLInput` would be enhanced as required with "experimental" features to
facilitate the implementation of the new UI with the goal of eventually phasing
out the use of `URLInput` entirely.


## Relationship to `<URLInput>`

As of Gutenberg 7.4, `<LinkControl> became the default link creation interface
within the Block Editor, replacing previous disparate uses of `<URLInput>` and
standardising the UI.

Nonetheless, it should be remembered that `<LinkControl>` builds **on top of**
`<URLInput>` and makes use of it under the hood.

The distinction between the two components is perhaps best represented as:

* `<URLInput>` - an input for presenting and managing selection behaviors
  associated with choosing a URL, optionally from a pool of available
  candidates.
* `<LinkControl>` - includes the features of `<URLInput>` , plus additional
  UI and behaviors to control how this URL applies to the concept of a "link". This includes link
  "settings" (eg: "opens in new tab", etc) and dynamic, "on the fly" link
  creation capabilities.


## Search Suggestions

Currently LinkControl will handle two types of input to create hyperlinks:

1. Entity searches - the user may input text-based search queries for entities retrieved from
   remove data sources (in the context of WordPress these are `Pages`). For
   example a user might search for a `Page` they have just created by name (eg:
   About) and the UI will return a matching result if found.
2. Direct entry - the user may also enter any arbitrary URL-like text. This
   includes full URLs (https://), URL fragements (eg: `#myinternallink`), `tel`
   protocol links (eg: `tel: 0800 1234`) and `mailto` protocol links (eg:
   `mailto: hello@wordpress.org).

In addition, `<LinkControl>` also allows for on-the-fly creation of links based
on the **current content of the `<input>` element**. When enabled, a default
"Create new" search suggestion is appended to all non-URL-like search results.
When this suggestion is
selected it will call the `createSuggestion` prop affording the developer the ability to create
new links on the fly (the [Navigation Block uses this to allow creation of Pages
from within the Block](https://github.com/WordPress/gutenberg/pull/19775/files)). See below for more details.

### Data sources

By default LinkControl utilizes the `__experimentalFetchLinkSuggestions` API
from `core/block-editor` in order to retrieve search suggestions for matching
`Page` post-type entities.

It is however, possible to provide your own entity search handler via the `fetchSearchSuggestions` prop.

## Props

`<LinkControl>` supports the following `props`:

### className

- Type: `String`
- Required: Yes

### value

- Type: `Object`
- Required: Yes

### settings

- Type: `Array`
- Required: No
- Default:
```
[
	{
		id: 'opensInNewTab',
		title: 'Open in New Tab',
	},
];
```

An array of settings objects. Each object will used to render a `ToggleControl`
for that setting.

You may choose to provide additional settings by providing an alternative array
of setting objects.

### fetchSearchSuggestions

- Type: `Function`
- Required: No

### onChange

- Type: `Function`
- Required: No

Use this callback to take an action after a user set or updated a link.
The function callback will receive the selected item, or Null.

```es6
<LinkControl
	onLinkChange={ ( item ) => {
		item
			? console.log( `The item selected has the ${ item.id } id.` )
			: console.warn( 'No Item selected.' );
	}
/>
```
