# Link Control

Renders a link control. A link control is a controlled input which maintains a value associated with a link (HTML anchor element) and relevant settings for how that link is expected to behave.

It is designed to provide a standardized UI for the creation of a link throughout the Editor, see History section at bottom for further background.

## Best Practices

### Ensuring unique instances

It is possible that a given editor may render multiple instances of the `<LinkControl>` component. As a result, it is important to ensure each instance is unique across the editor to avoid state "leaking" between components.

Why would this happen?

React's reconciliation algorithm means that if you return the same element from a component, it keeps the nodes around as an optimization, even if the props change. This means that if you render two (or more) `<LinkControl>`s, it is possible that the `value` from one will appear in the other as you move between them.

As a result it is recommended that consumers provide a `key` prop to each instance of `<LinkControl>`:

```jsx
<LinkControl key="some-unique-key" { ...props } />
```

This will cause React to return the same component/element type but force remount a new instance, thus avoiding the issues described above.

For more information see: https://github.com/WordPress/gutenberg/pull/34742.

## Relationship to `<URLInput>`

As of Gutenberg 7.4, `<LinkControl>` became the default link creation interface within the Block Editor, replacing previous disparate uses of `<URLInput>` and standardizing the UI.

Nonetheless, it should be remembered that `<LinkControl>` builds **on top of** `<URLInput>` and makes use of it under the hood.

The distinction between the two components is perhaps best summarized by the following definitions:

-   `<URLInput>` - an input for presenting and managing selection behaviors associated with choosing a URL, optionally from a pool of available candidates.
-   `<LinkControl>` - includes the features of `<URLInput>`, plus additional UI and behaviors to control how this URL applies to the concept of a "link". This includes link "settings" (eg: "opens in new tab", etc) and dynamic, "on the fly" link creation capabilities.

## Persistent "Advanced" (settings) toggle state

By default the link "settings" are hidden and can be toggled open/closed by way of a button labelled `Advanced` in the UI.

In some circumstances if may be desirable to persist the toggle state of this portion of the UI so that it remains in the last state triggered by user interaction.

For example, once the user has toggled the UI to "open", then it may remain open across all links on the site until such time as the user toggles the UI back again.

Consumers who which to take advantage of this functionality should ensure that their block editor environment utilizes the [`@wordpress/preferences`](packages/preferences/README.md) package. By default the `<LinkControl>` component will attempt to persist the state of UI to a setting named `linkControlSettingsDrawer` with a scope of `core/block-editor`. If the preferences package is not available then local state is used and the setting will not be persisted.

## Search Suggestions

When creating links the `LinkControl` component will handle two kinds of input from users:

1. Entity searches - the user may input free-text based search queries for entities retrieved from remote data sources (in the context of WordPress these are post-type entities). For example, a user might search for a `Page` they have just created by name (eg: About) and the UI will return a matching result if found.
2. Direct entry - the user may also enter any arbitrary URL-like text. This includes full URLs (https://), URL fragments (eg: `#myinternallink`), `tel` protocol links (eg: `tel: 0800 1234`) and `mailto` protocol links (eg: `mailto: hello@wordpress.org`).

In addition, `<LinkControl>` also allows for on the fly creation of links based on the **current content of the `<input>` element**. When enabled, a default "Create new" search suggestion is appended to all non-URL-like search results.

When this suggestion is selected it will call the `createSuggestion` prop affording the developer the ability to create new links on the fly (the [Navigation Block uses this to allow creation of Pages from within the Block](https://github.com/WordPress/gutenberg/pull/19775/files)). See below for more details.

### Data sources

By default `LinkControl` utilizes the `__experimentalFetchLinkSuggestions` API from `core/block-editor` in order to retrieve search suggestions for matching post-type entities.

By default this provides no functionality and so you must implement and provide this in your own Editor instance ([example](https://github.com/WordPress/gutenberg/blob/65c752816f46a9334b84f4801d80dea00ed76fba/packages/editor/src/components/provider/use-block-editor-settings.js#L114-L115)).

## Props

### value

-   Type: `Object`
-   Required: No

Current link value.

A link `value` is composed of a union between the values of default link properties and any custom link `settings`.

The resulting default properties of `value` include:

-   `url` (`string`): Link URL.
-   `title` (`string`, optional): Link title.
-   `opensInNewTab` (`boolean`, optional): Whether link should open in a new browser tab. This value is only assigned when not providing a custom `settings` prop.

Note: `<LinkControl>` maintains an internal state tracking temporary user edits to the link `value` prior to submission. To avoid unwanted synchronization of this internal value, it is advised that the `value` prop is stabilized (likely via memozation) before it is passed to the component. This will avoid unwanted loss of any changes users have may made whilst interacting with the control.

```jsx
const memoizedValue = useMemo(
	() => ( {
		url: attributes.url,
		type: attributes.type,
		opensInNewTab: attributes.target === '_blank',
		title: attributes.text,
	} ),
	[
		attributes.url,
		attributes.type,
		attributes.target,
		attributes.text,
	]
);

<LinkControl
	value={ memoizedValue }
>
```

### settings

-   Type: `Array`
-   Required: No
-   Default:

```js
[
	{
		id: 'opensInNewTab',
		title: 'Open in new tab',
	},
];
```

An array of settings objects associated with a link (for example: a setting to determine whether or not the link opens in a new tab). Each object will be used to render a `ToggleControl` for that setting.

To disable settings, pass in an empty array. for example:

```jsx
<LinkControl settings={ [] } />
```

### onChange

-   Type: `Function`
-   Required: No

Value change handler, called with the updated value if the user selects a new link or updates settings.

```jsx
<LinkControl
	onChange={ ( nextValue ) => {
		console.log( `The selected item URL: ${ nextValue.url }.` );
	} }
/>
```

### showSuggestions

-   Type: `boolean`
-   Required: No
-   Default: `true`

Whether to present suggestions when typing the URL.

### showInitialSuggestions

-   Type: `boolean`
-   Required: No
-   Default: `false`

Whether to present initial suggestions immediately.

### suggestionsQuery

-   Type: `Object`
-   Required: No

Controls the query parameters used to search for suggestions. For example, to limit a query to just `Page` types use:

```jsx
<LinkControl
	suggestionsQuery={ {
		type: 'post',
		subtype: 'page',
	} }
/>
```

### forceIsEditingLink

-   Type: `boolean`
-   Required: No

Controls the internal editing state of the component. If passed as either `true` or `false` will respectively show or hide the URL input field.

### createSuggestion

-   Type: `function`
-   Required: No
-   Returns: When called may return either a new `suggestion` directly or a `Promise` which resolves to a
    new `suggestion`.

Used to handle the dynamic creation of a new `suggestion` (and ultimately new link `value`) within the Link UI.

When provided, an option is appended to all search results requests which when clicked will call the `createSuggestion` callback (passing the current value of the search `<input>`). This affords the parent component the opportunity to dynamically create a new link `suggestion` (see above).

This `suggestion` will then be _automatically_ passed to the `onChange` handler to create **the next link value**.

As a result of the above, this prop is often used to allow on the fly creation of new entities (eg: `Posts`, `Pages`) based on the text the user has entered into the link search UI. As an example, the Navigation Block uses `createSuggestion` to create Pages on the fly from within the Block itself.

### onRemove

-   Type: `Function`
-   Required: No
-   Default: null

An optional handler, which when passed will trigger the display of an `Unlink` UI within the control. This handler is expected to remove the current `value` of the control thus resetting it back to a default state. The key use case for this is allowing users to remove a link from the control without relying on there being an "unlink" control in the block toolbar.

#### Search `suggestion` values

A `suggestion` should have the following shape:

```js
{
	id: // uniquely identifies the suggestion.
	type: // the type of the suggestion (eg: `post`).
	title: // human-readable label for the suggestion.
	url: // any string representing a URL value
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

### renderControlBottom

-   Type: `Function`
-   Required: No
-   Default: null

A render prop that can be used to pass optional controls to be rendered at the bottom of the component.

# LinkControlSearchInput

The search input used by `LinkControl`. It is a wrapper over `<URLInput />` that caters it to `LinkControl`'s needs.

## Props

### allowDirectEntry

-   Type: `boolean`
-   Required: No
-   Default: `true`

The opposite of `noDirectEntry` from LinkControl, refer to an earlier section of this README file for more details.

### children

-   Type: `Element`
-   Required: No

If passed, children are rendered after the input.

```jsx
<LinkControlSearchInput>
	<HStack justify="right">
		<Button
			type="submit"
			label={ __( 'Submit' ) }
			icon={ keyboardReturn }
			className="block-editor-link-control__search-submit"
		/>
	</HStack>
</LinkControlSearchInput>
```

### className

-   Type: `string`
-   Required: No
-   Default: `null`

Passed verbatim to URLInput, refer to it's README.md for more details.

### createSuggestionButtonText

-   Type: `string`
-   Required: No

The same as in LinkControl, refer to an earlier section of this README file for more details.

### currentLink

-   Type: `Object`
-   Required: No
-   Default: `{}`

The same as `value` in LinkControl, refer to an earlier section of this README file for more details.

### fetchSuggestions

-   Type: `Function`
-   Required: No

Custom search handler for suggestions. If specified, it's passed to `URLInput` as `__experimentalFetchLinkSuggestions`, if not, the default handler is used.

Refer to URLInput's README.md for more details about `__experimentalFetchLinkSuggestions` and see the [createSuggestion](#createSuggestion) section of this file to learn more about suggestions.

### onChange

-   Type: `Function`
-   Required: No

Value change handler passed to the underlying `<URLInput />`. Refer to URLInput's README.md for more details.

### onCreateSuggestion

-   Type: `Function`
-   Required: No

By default, when there are no matching results, LinkControlSearchInput proposes creating a new page by rendering a suggestion with
`{ type: __CREATE__, title: <<User input>> }` properties. This function is called when that suggestion is selected.

See the [createSuggestion](#createSuggestion) section of this file to learn more about suggestions.

```jsx
<LinkControlSearchInput
    onCreateSuggestion={( inputValue ) => {
        createNewPage( inputValue );
    })
/>
```

### onSelect

-   Type: `Function`
-   Required: No

Suggestion selection handler, called when the user chooses one of the suggested items with `selectedValues` as the argument.

### placeholder

-   Type: `string`
-   Required: No

Passed verbatim to URLInput, refer to it's README.md for more details.

### renderSuggestions

-   Type: `Function`
-   Required: No
-   Default: `(props) => <LinkControlSearchResults {...props} />`

Function used to render search suggestions. It is decorated with extra properties and passed to `URLInput` as `__experimentalRenderSuggestions`.

The following properties are provided by URLInput:

-   buildSuggestionItemProps
-   handleSuggestionClick
-   isInitialSuggestions
-   isLoading
-   suggestions
-   selectedSuggestion
-   suggestionsListProps
-   currentInputValue

The following extra properties are provided by LinkControlSearchInput:

-   createSuggestionButtonText
-   handleSuggestionClick
-   instanceId
-   suggestionsQuery
-   withCreateSuggestion

See the [createSuggestion](#createSuggestion) section of this file to learn more about suggestions.

```jsx
<LinkControlSearchInput
    renderSuggestions={( { suggestions } ) => {
        return (
            <Popover focusOnMount={ false } placement="bottom">
                <ul>
                    { suggestions.map( () => ( <li key={ `${ suggestion.id }-${ suggestion.type }` }>{ suggestion.title }</li> ) ) }
                </ul>
            </Popover>
        );
    })
/>
```

```jsx
<LinkControlSearchInput
    renderSuggestions={( suggestionsProps ) => {
        return (
            <Popover focusOnMount={ false } placement="bottom">
                <LinkControlSearchResults { ...suggestionsProps } />
            </Popover>
        );
    })
/>
```

### showInitialSuggestions

-   Type: `boolean`
-   Required: No
-   Default: `false`

The same as in LinkControl, refer to an earlier section of this README file for more details.

### showSuggestions

-   Type: `boolean`
-   Required: No
-   Default: `true`

The same as in LinkControl, refer to an earlier section of this README file for more details.

### suggestionsQuery

-   Type: `Object`
-   Required: No
-   Default: `{}`

The same as in LinkControl, refer to an earlier section of this README file for more details.

### withCreateSuggestion

-   Type: `boolean`
-   Required: No
-   Default: `true`

The same as in LinkControl, refer to an earlier section of this README file for more details.

### value

-   Type: `string`
-   Required: No

Passed verbatim to URLInput, refer to it's README.md for more details.

# LinkControlSearchResults

The list of search results used by `LinkControlSearchInput`.

## Props

### buildSuggestionItemProps

-   Type: `Function`
-   Required: Yes

Function that takes `suggestion` and `index` as arguments, and returns HTML props of the suggestion item. When this component is used with `LinkControlSearchInput`, this property is provided by `URLInput`.

### currentInputValue

-   Type: `string`
-   Required: Yes

Current value of the related search input, used e.g. for highlighting matching part of the page title. When this component is used with `LinkControlSearchInput`, this property is provided by `LinkControlSearchInput`.

### handleSuggestionClick

-   Type: `Function`
-   Required: Yes

Called with `suggestion` as the argument, when said suggestion is clicked by the user. When this component is used with `LinkControlSearchInput`, this property is provided by `LinkControlSearchInput`.

See the [createSuggestion](#createSuggestion) section of this file to learn more about suggestions.

### instanceId

-   Type: `string`
-   Required: Yes

Unique ID of parent component, used for the aria-label property. When this component is used with `LinkControlSearchInput`, this property is provided by `LinkControlSearchInput`.

### isLoading

-   Type: `boolean`
-   Required: Yes

Whether the suggestions are being fetched at the moment. When this component is used with `LinkControlSearchInput`, this property is provided by `URLInput`.

### isInitialSuggestions

-   Type: `boolean`
-   Required: No

Whether this component was rendered to show initial suggestions (the ones displayed right after mounting, before the user begins interacting with LinkControl).

### selectedSuggestion

-   Type: `Object`
-   Required: Yes

The suggestions that is currently selected. When this component is used with `LinkControlSearchInput`, this property is provided by `LinkControlSearchInput`.

### suggestions

-   Type: `Array`
-   Required: Yes

The list of suggestions to render. When this component is used with `LinkControlSearchInput`, this property is provided by `URLInput`.

### suggestionsListProps

-   Type: `Object`
-   Required: No

List of additional HTML properties passed to the element wrapping the list of suggestions. When this component is used with `LinkControlSearchInput`, this property is provided by `URLInput`.

### createSuggestionButtonText

-   Type: `string`
-   Required: No

The same as in LinkControl, refer to an earlier section of this README file for more details.

### suggestionsQuery

-   Type: `Object`
-   Required: No

The same as in LinkControl, refer to an earlier section of this README file for more details.

### withCreateSuggestion

-   Type: `boolean`
-   Required: No

The same as in LinkControl, refer to an earlier section of this README file for more details.

# LinkControlSearchItem

A single suggestion rendered by `LinkControlSearchResults`.

## Props

### itemProps

-   Type: `Object`
-   Required: No

A list of extra HTML properties for the root element rendered by this component.

### isSelected

-   Type: `boolean`
-   Required: No
-   Default: `false`

Whether this item represents a selected suggestion.

### isURL

-   Type: `boolean`
-   Required: No
-   Default: `false`

Whether this item represents a suggestion referring to a URL (e.g. post, page).

### onClick

-   Type: `Function`
-   Required: Yes

Click handler, called with click event as the only argument.

### searchTerm

-   Type: `string`
-   Required: Yes

The search term as specified by the user. Used for highlighting the matching part of the suggestion title.

### shouldShowType

-   Type: `boolean`
-   Required: No
-   Default: `false`

If true, type of the suggestion is rendered (e.g. post, tag)

### suggestion

-   Type: `Object`
-   Required: Yes

The suggestion to render.

See the [createSuggestion](#createSuggestion) section of this file to learn more about suggestions.

## History

Much of the context for this component can be found in [the original Issue](https://github.com/WordPress/gutenberg/issues/17557).

Previously iterations of a hyperlink UI existed within the Gutenberg interface but these tended to be highly tailored to their individual use cases and were not standardized, each having their own implementation.

These older UIs tended to make use of two existing components: `URLInput` and `URLPopover`. When a requirement was raised to implement a new UI for hyperlink creation, an assessment of these existing components was undertaken and it was determined that they were too opinionated as to be easily refactored to accommodate the new use cases required by the new UI. Attempting to do so would also have meant unavoidable breaking changes to the interface of `URLInput` which would have (most probably) caused breaking changes to ripple across not only the Core codebase, but also that of 3rd party Plugins.

As a result, it was agreed that a new component `LinkControl` would be created to realise the new hyperlink creation interface. This new UI would begin life as an experimental component which would consume `URLInput` internally. The API of `URLInput` would be enhanced as required with "experimental" features to facilitate the implementation of the new UI.
