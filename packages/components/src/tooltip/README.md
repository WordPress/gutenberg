# ToolTip

Tooltip is a React component to render floating help text relative to a node when it receives focus or it is hovered upon by a mouse. If the tooltip exceeds the bounds of the page in the direction it opens, its position will be flipped automatically.

## Usage

Render a Tooltip, passing as a child the element to which it should anchor:

```jsx
import { Tooltip } from '@wordpress/components';

const MyTooltip = () => (
	<Tooltip text="More information">
		<div>Hover for more information</div>
	</Tooltip>
);
```

## Props

The component accepts the following props:

#### `children`: `React.ReactElement`

The element to which the tooltip should anchor.

**NOTE:** Accepts only one child element.

-   Required: Yes

#### `delay`: `number`

The amount of time in milliseconds to wait before showing the tooltip.

-   Required: No
-   Default: `700`

#### `hideOnClick`: `boolean`

Option to hide the tooltip when the anchor is clicked.

-   Required: No
-   Default: `true`

#### `position`: `string`

The direction in which the tooltip should open relative to its parent node. Specify y- and x-axis as a space-separated string. Supports `"top"`, `"middle"`, `"bottom"` y axis, and `"left"`, `"center"`, `"right"` x axis.

-   Required: No
-   Default: `"bottom"`

#### `shortcut`: `string` | `object`

An option for adding accessible keyboard shortcuts.

If shortcut is a string, it is expecting the display text. If shortcut is an object, it will accept the properties of `display`: `string` and `ariaLabel`: `string`.

-   Required: No

#### `text`: `string`

The text shown in the tooltip when anchor element is focused or hovered.

-   Required: No
