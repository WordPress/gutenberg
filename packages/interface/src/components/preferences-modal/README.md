# PreferencesModal

`PreferencesModal` renders a modal with editor preferences. It can take a `PreferencesModalTabs` component, which accepts multiple tabs, and/or other child components. On small viewports, the modal is fullscreen.

This component implements a `Modal` component from the `@wordpress/components` package.

Sections passed to this component should use `PreferencesModalSection` component from the `@wordpress/interface` package.


## Example

```jsx
function MyEditorPreferencesModal() {
	const { closeModal } = useDispatch( editPostStore );
	const sections = [
		{
			name: 'section 1',
			tabLabel: __( 'Section 1' ),
			content: (
						<PreferencesModalSection
							title={ __( 'Publishing' ) }
							description={ __(
								'Change options related to publishing.'
							) }
						>
							<EnablePublishSidebarOption
								help={ __(
									'Review settings, such as visibility and tags.'
								) }
								label={ __(
									'Include pre-publish checklist'
								) }
							/>
						</PreferencesModalSection>
					) 

		}
		{
			name: 'section 2',
			tabLabel: __( 'Section 2' ),
			content: (
						<PreferencesModalSection
							title={ __( 'Additional' ) }
							description={ __(
								'Add extra areas to the editor.'
							) }
						>
							// Section content here
						</PreferencesModalSection>
					) 

		}
	]
	return (
		<PreferencesModal closeModal={ closeModal }>
			<PreferencesModalTabs sections={ sections } />
		<PreferencesModal />
	);
}
```

## Props

### closeModal

A function to call when closing the modal.

-   Type: `Function`
-   Required: Yes.
