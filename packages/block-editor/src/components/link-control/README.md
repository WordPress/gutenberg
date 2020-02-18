# Link Control

Renders a link control. A link control is a controlled input which maintains a
value associated with a link (HTML anchor element) and relevant settings for how
that link is expected to behave.

It is designed to provide a standardized UI for the
creation of link throughout the Editor.


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

### value

- Type: `Object`
- Required: No

Current link value.

A link value contains is composed as a union of the default properties and any custom settings values.

Default properties include:

- `url` (`string`): Link URL.
- `title` (`string`, optional): Link title.
- `opensInNewTab` (`boolean`, optional): Whether link should open in a new browser tab.This value is only assigned if not providing a custom `settings` prop.

### settings

- Type: `Array`
- Required: No
- Default:
```
[
	{
		id: 'opensInNewTab',
		title: 'Open in new tab',
	},
];
```

An array of settings objects. Each object will used to render a `ToggleControl` for that setting.

### onClose

- Type: `Function`
- Required: No

### onChange

- Type: `Function`
- Required: No

Value change handler, called with the updated value if the user selects a new link or updates settings.

```jsx
<LinkControl
	onChange={ ( nextValue ) => {
		console.log( `The selected item URL: ${ nextValue.url }.` );
	}
/>
```

### showInitialSuggestions

- Type: `boolean`
- Required: No
- Default: `false`

Whether to present initial suggestions immediately.

### forceIsEditingLink

- Type: `boolean`
- Required: No

If passed as either `true` or `false`, controls the internal editing state of the component to respective show or not show the URL input field.


### createSuggestion

- Type: `function`
- Required: No

Used to handle the dynamic creation of new suggestions within the Link UI. When
the prop is provided, an option is added to the end of all search
results requests which when clicked will call `createSuggestion` callback
(passing the current value of the search `<input>`) in
order to afford the parent component the opportunity to dynamically create a new
link `value` (see above).

This is often used to allow on-the-fly creation of new entities (eg: `Posts`,
`Pages`) based on the text the user has entered into the link search UI. For
example, the Navigation Block uses this to create Pages on demand.

When called, `createSuggestion` may return either a new suggestion directly or a `Promise` which resolves to a
new suggestion. Suggestions have the following shape:

```js
{
	id: // unique identifier
	type: // "url", "page", "post"...etc
	title: // "My new suggestion"
	url: // any string representing the URL value
}
```

#### Example
```jsx
// Promise example
<LinkControl
	createSuggestion={ async (inputText) => {
        // Hard coded values. These could be dynamically created by calling out to an API which creates an entity (eg: https://developer.wordpress.org/rest-api/reference/pages/#create-a-page).
		return {
			id: 1234,
			type: 'page',
			title: inputText,
			url: '/some-url-here'
		}
	}}
/>

// Non-Promise example
<LinkControl
	createSuggestion={ (inputText) => (
		{
			id: 1234,
			type: 'page',
			title: inputText,
			url: '/some-url-here'
		}
	)}
/>
```