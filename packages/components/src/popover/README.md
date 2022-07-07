# Popover

Popover is a React component to render a floating content modal. It is similar in purpose to a tooltip, but renders content of any sort, not only simple text. It anchors itself to its parent node, optionally by a specified direction. If the popover exceeds the bounds of the page in the direction it opens, its position will be flipped automatically.

## Usage

Render a Popover within the parent to which it should anchor:

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

If a Popover is returned by your component, it will be shown. To hide the popover, simply omit it from your component's render value.

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

### focusOnMount

By default, the _first tabblable element_ in the popover will receive focus when it mounts. This is the same as setting `focusOnMount` to `"firstElement"`. If you want to focus the container instead, you can set `focusOnMount` to `"container"`.

Set this prop to `false` to disable focus changing entirely. This should only be set when an appropriately accessible substitute behavior exists.

-   Type: `String` or `Boolean`
-   Required: No
-   Default: `"firstElement"`

### placement

The direction in which the popover should open relative to its parent node or anchor node. 

The available base placements are 'top', 'right', 'bottom', 'left'.

Each of these base placements has an alignment in the form -start and -end. For example, 'right-start', or 'bottom-end'. These allow you to align the tooltip to the edges of the button, rather than centering it.

-   Type: `String`
-   Required: No
-   Default: `"bottom-start"`

### children

The content to be displayed within the popover.

-   Type: `Element`
-   Required: Yes

### className

An optional additional class name to apply to the rendered popover.

-   Type: `String`
-   Required: No

### onClose

A callback invoked when the popover should be closed.

-   Type: `Function`
-   Required: No

### onFocusOutside

A callback invoked when the focus leaves the opened popover. This should only be provided in advanced use-cases when a Popover should close under specific circumstances; for example, if the new `document.activeElement` is content of or otherwise controlling Popover visibility.

Defaults to `onClose` when not provided.

-   Type: `Function`
-   Required: No

### expandOnMobile

Opt-in prop to show popovers fullscreen on mobile, pass `false` in this prop to avoid this behavior.

-   Type: `Boolean`
-   Required: No
-   Default: `false`

### headerTitle

Set this to customize the text that is shown in popover's header when it is fullscreen on mobile.

-   Type: `String`
-   Required: No

### noArrow

Set this to hide the arrow which visually indicates what the popover is anchored to. Note that the arrow will not display if `position` is set to `"middle center"`.

-   Type: `Boolean`
-   Required: No
-   Default: `true`

### anchorRect

A custom `DOMRect` object at which to position the popover. `anchorRect` is used when the position (custom `DOMRect` object) of the popover needs to be fixed at one location all the time.

-   Type: `DOMRect`
-   Required: No

### getAnchorRect

A callback function which is used to override the anchor value computation algorithm. `anchorRect` will take precedence over this prop, if both are passed together.

If you need the `DOMRect` object i.e., the position of popover to be calculated on every time, the popover re-renders, then use `getAnchorRect`.

`getAnchorRect` callback function receives a reference to the popover anchor element as a function parameter and it should return a `DOMRect` object.

-   Type: `Function`
-   Required: No
