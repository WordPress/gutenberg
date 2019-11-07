# Link Control

## Props

### className

- Type: `String`
- Required: Yes

### currentLink

- Type: `Object`
- Required: Yes

### currentSettings

- Type: `Array`
- Required: No
- Default: 
```
[
	{
		id: 'newTab',
		title: 'Open in New Tab',
		checked: false,
	},
];
```

An array of settings objects. Each object will used to render a `ToggleControl` for that setting. See also `onSettingsChange`.

### fetchSearchSuggestions

- Type: `Function`
- Required: No

## Event handlers

### onChangeMode

- Type: `Function`
- Required: No

Use this callback to know when the LinkControl component changes its mode to `edit` or `show`
through of its function parameter.

```es6
<LinkControl
	onChangeMode={ ( mode ) => { console.log( `Mode change to ${ mode } mode.` ) }
/> 
```  

### onClose

- Type: `Function`
- Required: No

### onKeyDown

- Type: `Function`
- Required: No

### onKeyPress

- Type: `Function`
- Required: No

### onLinkChange

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

### onSettingsChange

- Type: `Function`
- Required: No
- Args:
  - `id` - the `id` property of the setting that changed (eg: `newTab`).
  - `value` - the `checked` value of the control.
  - `settings` - the current settings object.

Called when any of the settings supplied as `currentSettings` are changed/toggled. May be used to attribute a Block's `attributes` with the current state of the control.

```
<LinkControl
	currentSettings={ [
		{
			id: 'opensInNewTab',
			title: __( 'Open in New Tab' ),
			checked: attributes.opensInNewTab, // Block attributes persist control state
		},
	] }
	onSettingsChange={ ( setting, value ) => setAttributes( { [ setting ]: value } ) }
/>
```

