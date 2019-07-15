# Dropdown

Dropdown is a React component to render a button that opens a floating content modal when clicked.
This components takes care of updating the state of the dropdown menu (opened/closed), handles closing the menu when clicking outside
and uses render props to render the button and the content.

## Usage


```jsx
import { Button, Dropdown } from '@wordpress/components';

const MyDropdown = () => (
	<Dropdown
		className="my-container-class-name"
		contentClassName="my-popover-content-classname"
		position="bottom right"
		renderToggle={ ( { isOpen, onToggle } ) => (
			<Button isPrimary onClick={ onToggle } aria-expanded={ isOpen }>
				Toggle Popover!
			</Button>
		) }
		renderContent={ () => (
			<div>
				This is the content of the popover.
			</div>
		) }
	/>
);
```

## Props

The component accepts the following props. Props not included in this set will be applied to the element wrapping Popover content.

### className

className of the global container

- Type: `String`
- Required: No

### contentClassName

If you want to target the dropdown menu for styling purposes, you need to provide a contentClassName because it's not being rendered as a children of the container node.

- Type: `String`
- Required: No

### position

The direction in which the popover should open relative to its parent node. Specify y- and x-axis as a space-separated string. Supports `"top"`, `"bottom"` y axis, and `"left"`, `"center"`, `"right"` x axis.

- Type: `String`
- Required: No
- Default: `"top center"`

### renderToggle

A callback invoked to render the Dropdown Toggle Button.

- Type: `Function`
- Required: Yes

The first argument of the callback is an object containing the following properties:

 - `isOpen`: whether the dropdown menu is opened or not
 - `onToggle`: A function switching the dropdown menu's state from open to closed and vice versa
 - `onClose`: A function that closes the menu if invoked

### renderContent

A callback invoked to render the content of the dropdown menu. Its first argument is the same as the `renderToggle` prop.

- Type: `Function`
- Required: Yes

### expandOnMobile

Opt-in prop to show popovers fullscreen on mobile, pass `false` in this prop to avoid this behavior.

 - Type: `Boolean`
 - Required: No
 - Default: `false`

### headerTitle

 Set this to customize the text that is shown in the dropdown's header when
 it is fullscreen on mobile.

 - Type: `String`
 - Required: No
 
 ### focusOnMount
 
 By default, the *first tabblable element* in the popover will receive focus when it mounts. This is the same as setting `focusOnMount` to `"firstElement"`. If you want to focus the container instead, you can set `focusOnMount` to `"container"`.
 
 Set this prop to `false` to disable focus changing entirely. This should only be set when an appropriately accessible substitute behavior exists.
 
 - Type: `String` or `Boolean`
 - Required: No
 - Default: `"firstElement"`

 ### popoverProps
 
Properties of popoverProps object will be passed as props to the `Popover` component.
Use this o object to access properties/feature if the `Popover` component that are not already exposed in the `Dropdown`component, e.g.: the hability to have the popover without an arrow. 
 
 - Type: `Object`
 - Required: No
