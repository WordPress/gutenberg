# Dropdown

Dropdown is a React component to render a button that opens a floating content modal when clicked.

This component takes care of updating the state of the dropdown menu (opened/closed), handles closing the menu when clicking outside and uses render props to render the button and the content.

## Usage

```jsx
import { Button, Dropdown } from '@wordpress/components';

const MyDropdown = () => (
	<Dropdown
		className="my-container-class-name"
		contentClassName="my-popover-content-classname"
		popoverProps={ { placement: 'bottom-start' } }
		renderToggle={ ( { isOpen, onToggle } ) => (
			<Button
				variant="primary"
				onClick={ onToggle }
				aria-expanded={ isOpen }
			>
				Toggle Popover!
			</Button>
		) }
		renderContent={ () => <div>This is the content of the popover.</div> }
	/>
);
```

## Props

The component accepts the following props. Props not included in this set will be applied to the element wrapping Popover content.

### `className`: `string`

className of the global container

-   Required: No

### `contentClassName`: `string`

If you want to target the dropdown menu for styling purposes, you need to provide a contentClassName because it's not being rendered as a child of the container node.

-   Required: No

### `defaultOpen`: `boolean`

The open state of the dropdown when initially rendered. Use when you do not need to control its open state. It will be overridden by the `open` prop if it is specified on the component's first render.

-   Required: No

### `expandOnMobile`: `boolean`

Opt-in prop to show popovers fullscreen on mobile.

-   Required: No
-   Default: `false`

### `focusOnMount`: `'firstElement' | boolean`

By default, the _first tabbable element_ in the popover will receive focus when it mounts. This is the same as setting this prop to `"firstElement"`.

Specifying a `true` value will focus the container instead.

Specifying a `false` value disables the focus handling entirely (this should only be done when an appropriately accessible substitute behavior exists).

-   Required: No
-   Default: `"firstElement"`

### `headerTitle`: `string`

Set this to customize the text that is shown in the dropdown's header when it is fullscreen on mobile.

-   Required: No

### `onClose`: `() => void`

A callback invoked when the popover should be closed.

-   Required: No

### `open`: `boolean`

The controlled open state of the dropdown. Must be used in conjunction with `onToggle`.

-   Required: No

### `onToggle`: `( willOpen: boolean ) => void`

A callback invoked when the state of the dropdown changes from open to closed and vice versa.

-   Required: No

### `popoverProps`: `WordPressComponentProps< Omit< PopoverProps, 'children' > 'div', false	>`

Properties of popoverProps object will be passed as props to the `Popover` component.

Use this object to access properties/features of the `Popover` component that are not already exposed in the `Dropdown` component, e.g.: the ability to have the popover without an arrow.

-   Required: No

### `renderContent`: `( props: CallbackProps ) => ReactNode`

A callback invoked to render the content of the dropdown menu.

- `isOpen`: whether the dropdown menu is opened or not
- `onToggle`: A function switching the dropdown menu's state from open to closed and vice versa
- `onClose`: A function that closes the menu if invoked

-   Required: Yes

### `renderToggle`: `( props: CallbackProps ) => ReactNode`

A callback invoked to render the Dropdown Toggle Button.

Its props are the same as the `renderContent` props.

-   Required: Yes

### `style`: `React.CSSProperties`

The style of the global container

-   Required: No
