# Link Control

Renders a link control. A link control is a controlled input which maintains
a value associated with a link (HTML anchor element) and relevant settings
for how that link is expected to behave.

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