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
		title: 'Open in New Tab',
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
