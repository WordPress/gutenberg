# Popover

`Popover` renders its content in a floating modal. If no explicit anchor is passed via props, it anchors to its parent element by default.

The behavior of the popover when it exceeds the viewport's edges can be controlled via its props.

## Usage

Render a Popover within the parent to which it should anchor.

If a Popover is returned by your component, it will be shown. To hide the popover, simply omit it from your component's render value.

```jsx
import { Button, Popover } from '@wordpress/components';
import { useState } from '@wordpress/element';

const MyPopover = () => {
	const [ isVisible, setIsVisible ] = useState( false );
	const toggleVisible = () => {
		setIsVisible( ( state ) => ! state );
	};

	return (
		<Button variant="secondary" onClick={ toggleVisible }>
			Toggle Popover!
			{ isVisible && <Popover>Popover is toggled!</Popover> }
		</Button>
	);
};
```

In order to pass an explicit anchor, you can use the `anchor` prop. When doing so, **the anchor element should be stored in local state** rather than a plain React ref to ensure reactive updating when it changes.

```jsx
import { Button, Popover } from '@wordpress/components';
import { useState } from '@wordpress/element';

const MyPopover = () => {
	// Use internal state instead of a ref to make sure that the component
	// re-renders when the popover's anchor updates.
	const [ popoverAnchor, setPopoverAnchor ] = useState();
	const [ isVisible, setIsVisible ] = useState( false );
	const toggleVisible = () => {
		setIsVisible( ( state ) => ! state );
	};

	return (
		<p ref={ setPopoverAnchor }>Popover s anchor</p>
		<Button variant="secondary" onClick={ toggleVisible }>
			Toggle Popover!
		</Button>
		{ isVisible && (
			<Popover
				anchor={ popoverAnchor }
			>
				Popover is toggled!
			</Popover>
		) }
	);
};
```

If you want Popover elements to render to a specific location on the page to allow style cascade to take effect, you must render a `Popover.Slot` further up the element tree:

```jsx
import { render } from '@wordpress/element';
import { Popover } from '@wordpress/components';
import Content from './Content';

const app = document.getElementById( 'app' );

render(
	<div>
		<Content />
		<Popover.Slot />
	</div>,
	app
);
```

## Props

The component accepts the following props. Props not included in this set will be applied to the element wrapping Popover content.

### `anchor`: `Element | VirtualElement | null`

The element that should be used by the `Popover` as its anchor. It can either be an `Element` or, alternatively, a `VirtualElement` — ie. an object with the `getBoundingClientRect()` and the `ownerDocument` properties defined.

The element should be stored in state rather than a plain ref to ensure reactive updating when it changes.

-   Required: No

### `anchorRect`: `DomRectWithOwnerDocument`

_Note: this prop is deprecated. Please use the `anchor` prop instead._

An object extending a `DOMRect` with an additional optional `ownerDocument` property, used to specify a fixed popover position.

-   Required: No

### `anchorRef`: `Element | PopoverAnchorRefReference | PopoverAnchorRefTopBottom | Range`

_Note: this prop is deprecated. Please use the `anchor` prop instead._

Used to specify a fixed popover position. It can be an `Element`, a React reference to an `element`, an object with a `top` and a `bottom` properties (both pointing to elements), or a `range`.

-   Required: No

### `animate`: `boolean`

Whether the popover should animate when opening.

-   Required: No
-   Default: `true`

### `children`: `ReactNode`

The `children` elements rendered as the popover's content.

-   Required: Yes

### `expandOnMobile`: `boolean`

Show the popover fullscreen on mobile viewports.

-   Required: No

### `flip`: `boolean`

Specifies whether the popover should flip across its axis if there isn't space for it in the normal placement.

When the using a 'top' placement, the popover will switch to a 'bottom' placement. When using a 'left' placement, the popover will switch to a `right' placement.

The popover will retain its alignment of 'start' or 'end' when flipping.

-   Required: No
-   Default: `true`

### `focusOnMount`: `'firstElement' | boolean`

By default, the _first tabbable element_ in the popover will receive focus when it mounts. This is the same as setting this prop to `"firstElement"`.

Specifying a `true` value will focus the container instead.

Specifying a `false` value disables the focus handling entirely (this should only be done when an appropriately accessible substitute behavior exists).

-   Required: No
-   Default: `"firstElement"`

### `onFocusOutside`: `( event: SyntheticEvent ) => void`

A callback invoked when the focus leaves the opened popover. This should only be provided in advanced use-cases when a popover should close under specific circumstances (for example, if the new `document.activeElement` is content of or otherwise controlling popover visibility).

When not provided, the `onClose` callback will be called instead.

-   Required: No

### `getAnchorRect`: `( fallbackReferenceElement: Element | null ) => DomRectWithOwnerDocument`

_Note: this prop is deprecated. Please use the `anchor` prop instead._

A function returning the same value as the one expected by the `anchorRect` prop, used to specify a dynamic popover position.

-   Required: No

### `headerTitle`: `string`

Used to customize the header text shown when the popover is toggled to fullscreen on mobile viewports (see the `expandOnMobile` prop).

-   Required: No

### `isAlternate`: `boolean`

_Note: this prop is deprecated. Please use the `variant` prop with the `'toolbar'` values instead._

Used to enable a different visual style for the popover.

-   Required: No

### `noArrow`: `boolean`

Used to show/hide the arrow that points at the popover's anchor.

-   Required: No
-   Default: `true`

### `offset`: `number`

The distance (in px) between the anchor and the popover.

-   Required: No

### `onClose`: `() => void`

A callback invoked when the popover should be closed.

-   Required: No

### `placement`: `'top' | 'top-start' | 'top-end' | 'right' | 'right-start' | 'right-end' | 'bottom' | 'bottom-start' | 'bottom-end' | 'left' | 'left-start' | 'left-end' | 'overlay'`

Used to specify the popover's position with respect to its anchor.

`overlay` is a special case that places the popover over the reference element.
Please note that other placement related props may not behave as excepted.

-   Required: No
-   Default: `"bottom-start"`

### `position`: `[yAxis] [xAxis] [optionalCorner]`

_Note: use the `placement` prop instead when possible._

Legacy way to specify the popover's position with respect to its anchor.

Possible values:

- `yAxis`: `'top' | 'middle' | 'bottom'`
- `xAxis`: `'left' | 'center' | 'right'`
- `corner`: `'top' | 'right' | 'bottom' | 'left'`
<!-- Break into two separate lists using an HTML comment -->
-   Required: No

### `resize`: `boolean`

Adjusts the size of the popover to prevent its contents from going out of view when meeting the viewport edges.

-   Required: No
-   Default: `true`

### `variant`: `'toolbar' | 'unstyled'`

Specifies the popover's style.

Leave undefined for the default style. Possible values are:
-   `unstyled`:  The popover is essentially without any visible style, it has no background, border, outline or drop shadow, but the popover contents are still displayed.
-   `toolbar`: A style that has no elevation, but a high contrast with other elements. This matches the style of the [`Toolbar` component](/packages/components/toolbar/README.md).
<!-- Break into two separate lists using an HTML comment -->
-   Required: No
