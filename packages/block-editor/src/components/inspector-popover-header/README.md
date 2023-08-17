# `InspectorPopoverHeader`

`<InspectorPopoverHeader />` renders a header that is suitable for use in an
inspector sidebar popover. For example, it is used to implement the Visibility,
Publish, Author, etc. popovers in the post sidebar. It displays a title,
optional action buttons, an optional close button, and optional help text.

## Usage

```jsx
const MyPostDatePopover = () => {
	return (
		<Dropdown
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button
					onClick={ onToggle }
					aria-expanded={ isOpen }
				>
					Select post date
				</Button>
			) }
			renderContent={ ( { onClose } ) => (
				<>
					<InspectorPopoverHeader
						title="Post date"
						actions={ [
							{
								label: 'Reset',
								onClick: () => {},
							},
						] }
						onClose={ onClose }
					/>
					Place form for editing post date here
				</>
			) }
		/>
	);
};
```

## Props

### title

Title to display in the header.

- Type: `String`
- Required: Yes

### actions

Array of actions to display in the header as a row of buttons. Each item in the
array must be an object and contains:

- `label`: String. Required. The action button's label.
- `icon`: Element. Optional. If specified, an icon button will be shown.
- `onClick`: Function. Optional. Called when the action button is clicked.

- Type: `Array`
- Required: No

### onClose

Called when the user presses the close button. If not provided, no close button
will appear.

- Type: `Function`
- Required: No

## help

Help text to display at the bottom of the header.

- Type: `String`
- Required: No
