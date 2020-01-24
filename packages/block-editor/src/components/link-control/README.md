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

- id (`string|number`): Unique identifier of link.
- url (`string`): Link URL.
- title (`string`): Link title.
- type (`string`): Type of link entity.
- subtype (`string`): Subtype of link entity.

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
		console.log( `The item selected has the ${ nextValue.id } id.` );
	}
/> 
```

### showInitialSuggestions

- Type: `boolean`
- Required: No
- Default: `false`

Whether to present initial suggestions immediately.
