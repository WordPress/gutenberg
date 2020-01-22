# Link Control

## Props

### value

- Type: `Object`
- Required: No

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

Use this callback to take an action after a user set or updated a link.
The function callback will receive the selected item.

```jsx
<LinkControl
	onChange={ ( item ) => {
		console.log( `The item selected has the ${ item.id } id.` );
	}
/> 
```

