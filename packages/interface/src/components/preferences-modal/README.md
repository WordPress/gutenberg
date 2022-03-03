# PreferencesModal

`PreferencesModal` renders a modal with editor preferences. It can take multiple sections, which are split into tabs. On small viewports, the modal is fullscreen and the tabs are closed by default. Markup differs between small and large viewports.

This component implements a `Modal` component from the `@wordpress/components` package.

Sections passed to this component should use `PreferencesModalSection` component from the `@wordpress/interface` package, and can also use `PreferencesModalBaseOption`, from the same package, to implement toggle buttons.


## Example

```jsx
function MyEditorPreferencesModal() {
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
							<PreferencesModalBaseOption
								label={ label }
								isChecked={ isChecked }
								onChange={ setIsChecked }
							>
								{ isChecked !== areCustomFieldsEnabled && (
									<CustomFieldsConfirmation willEnable={ isChecked } />
								) }
							</PreferencesModalBaseOption>
						</PreferencesModalSection>
					) 

		}
	]
	return (
		<PreferencesModal sections={ sections } />
	);
}
```

## Props

### closeModal

A function to call when closing the modal.

-   Type: `Function`
-   Required: Yes.

### sections

Sections to populate the modal with. Takes an array of objects, where each should include `name`, `tablabel` and `content`.

-   Type: `Array`
-   Required: Yes.
