# PreferenceBaseOption

`PreferenceBaseOption` renders a toggle meant to be used within `PreferencesModal`. 

This component implements a `ToggleControl` component from the `@wordpress/components` package.

## Example

```jsx
function MyEditorPreferencesOption() {
	return (
		<PreferenceBaseOption
			label={ label }
			isChecked={ isChecked }
			onChange={ setIsChecked }
		>
			{ isChecked !== areCustomFieldsEnabled && (
				<CustomFieldsConfirmation willEnable={ isChecked } />
			) }
		</PreferenceBaseOption>
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

