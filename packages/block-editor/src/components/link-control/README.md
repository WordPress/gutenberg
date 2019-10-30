# Link Control

## Props

### className

- Type: `String`
- Required: Yes

### currentLink

- Type: `Object`
- Required: Yes

### currentSettings

- Type: `Object`
- Required: Yes

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

### onSettingChange

- Type: `Function`
- Required: No
