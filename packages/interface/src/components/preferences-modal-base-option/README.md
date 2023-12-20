#__unstablePreferencesModalBaseOption

`__unstablePreferencesModalBaseOption` renders a toggle meant to be used with `PreferencesModal`. 

This component implements a `ToggleControl` component from the `@wordpress/components` package.

**It is an unstable component so is subject to breaking changes at any moment. Use at own risk.**

## Example

```jsx
function MyEditorPreferencesOption() {
	return (
		<__unstablePreferencesModalBaseOption
			label={ label }
			isChecked={ isChecked }
			onChange={ setIsChecked }
		>
			{ isChecked !== areCustomFieldsEnabled && (
				<CustomFieldsConfirmation willEnable={ isChecked } />
			) }
		</__unstablePreferencesModalBaseOption>
	)				
}
```

## Props

### help 
### label 
### isChecked 
### onChange

These props are passed directly to ToggleControl, so see [ToggleControl readme](https://github.com/WordPress/gutenberg/blob/trunk/packages/components/src/toggle-control/README.md) for more info.

### children

Components to be rendered as content.

-   Type: `Element`
-   Required: No.

