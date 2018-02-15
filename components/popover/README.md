Popover
=======

Popover is a React component to render a floating content modal. It is similar in purpose to a tooltip, but renders content of any sort, not only simple text. It anchors itself to its parent node, optionally by a specified direction. If the popover exceeds the bounds of the page in the direction it opens, its position will be flipped automatically.

## Usage

Render a Popover within the parent to which it should anchor:

```jsx
import { Popover } from '@wordpress/components';

function ToggleButton( { isVisible, toggleVisible } ) {
	return (
		<button onClick={ toggleVisible }>
			Toggle Popover!
			{ isVisible && (
				<Popover
					onClose={ toggleVisible }
					onClick={ ( event ) => event.stopPropagation() }
				>
					Popover is toggled!
				</Popover>
			) }
		</button>
	);
}
```

If a Popover is returned by your component, it will be shown. To hide the popover, simply omit it from your component's render value.

If you want Popover elementss to render to a specific location on the page to allow style cascade to take effect, you must render a `Popover.Slot` further up the element tree:

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

By default, the popover will receive focus when it mounts. To suppress this behavior, assign `focusOnMount` to `false`. This should only be assigned when an appropriately accessible substitute behavior exists.

- Type: `Boolean`
- Required: No
- Default: `true`

### position

The direction in which the popover should open relative to its parent node. Specify y- and x-axis as a space-separated string. Supports `"top"`, `"bottom"` y axis, and `"left"`, `"center"`, `"right"` x axis.

- Type: `String`
- Required: No
- Default: `"top center"`

### children

The content to be displayed within the popover.

- Type: `Element`
- Required: Yes

### className

An optional additional class name to apply to the rendered popover.

- Type: `String`
- Required: No

## onClose

A callback invoked when the popover should be closed.

- Type: `Function`
- Required: No

## onClickOutside

A callback invoked when the user clicks outside the opened popover, passing the click event. The popover should be closed in response to this interaction. Defaults to `onClose`.

- Type: `Function`
- Required: No

## expandOnMobile

Opt-in prop to show popovers fullscreen on mobile, pass `false` in this prop to avoid this behavior.

 - Type: `Boolean`
 - Required: No
 - Default: `false`
