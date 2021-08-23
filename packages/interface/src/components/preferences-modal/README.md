# PreferencesModal components

`PreferencesModal`, `PreferencesModalTabs` and `PreferencesModalSection` are a family of components that greatly simplify building a WordPress editor preferences modal.

`PreferencesModal` is a basic modal component that implements `Modal` from the `@wordpress/components` package.

`PreferenceModalTabs` should be used to implement the responsive tab based menu structure within the preferences modal. It implements a `TabPanel` from `@wordpress/components` for desktop viewports, and a `Navigation` menu for smaller viewports.

`PreferenceModalSection` represents a particular section within a tab that groups settings.

See also the `PreferencesModalToggle` and `PreferencesModalFeatureToggle` components in this package that can be used to implement individual preference toggles.

## Example

```jsx
function MyPreferencesModal( { closeModal }) {
	// ...

	const tabs = useMemo(
		() => [
			{
				name: 'general',
				title: __( 'General' ),
				content: (
					<PreferencesModalSection
						title={ __( 'Appearance' ) }
						description={ __(
							'Customize options related to the block editor interface and editing flow.'
						) }
					>
						<PreferencesModalFeatureToggle
							scope="namespace/editor-name"
							feature="reducedUI"
							label={ __( 'Reduce the interface' ) }
							help={ __(
								'Compacts options and outlines in the toolbar.'
							) }
						>
						<PreferencesModalFeatureToggle
							scope="namespace/editor-name"
							feature="focusMode"
							label={ __( 'Spotlight mode' ) }
							help={ __(
								'Highlights the current block and fades other content.'
							) }
						/>
					</PreferencesModalSection>
				),
			},
			{
				name: 'panels',
				title: __( 'Panels' ),
				content: (
					<PreferencesModalSection
						title={ __( 'Document settings' ) }
						description={ __( 'Choose what displays in the panel.' ) }
					>
						<PreferencesModalToggle
							label={ __( 'Permalink' ) }
							onChange={ onTogglePermalink }
							isChecked={ isPermalinkEnabled }
						/>
					</PreferencesModalSection>
				),
			}
		],
		[]
	);

	return (
		<PreferencesModal onRequestClose={ closeModal }>
			<PreferencesModalTabs tabs={ tabs } />
		</PreferencesModal>
	);
}
```

# PreferencesModal

`PreferencesModal` implements `Modal` from the `@wordpress/components` package and accepts the same props.

## Props

### onRequestClose

A function that is called when the user has indicated they want to close the modal. For example when clicking the close button, pressing <kbd>Escape</kbd>, or clicking outside of the modal.

-   Type: `function`
-   Required: Yes

### title

The title of the modal. Defaults to the internationalized string 'Preferences'.

-   Type: `String`
-   Required: No

### closeLabel

The label of the close button in the modal. Defaults tot he internationalized string 'Close'.

-   Type: `String`
-   Required: No

# PreferencesModalTabs

## Props

### tabs

A flat array of tabs. Each item in the array is an object with three properties:

- `name` - A unique name for the tab. This value is used internally by the `PreferencesModalTabs` to track which tab is currently visible.
- `title` - The visible title of the tab.
- `content` - A react element representing the content of the tab.

-   Type: `array`
-   Required: Yes

# PreferencesModalSection

## Props

### title

The title of the section.

-   Type: `String`
-   Required: Yes

### description

A description of the section.

-   Type: `String`
-   Required: No
