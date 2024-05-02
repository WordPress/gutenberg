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

### Nested tooltips

In case one or more `Tooltip` components are rendered inside another `Tooltip` component, only the tooltip associated to the outermost `Tooltip` component will be rendered in the browser and shown to the user appropriately. The rest of the nested `Tooltip` components will simply no-op and pass-through their anchor.

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

#### `placement`: `'top' | 'top-start' | 'top-end' | 'right' | 'right-start' | 'right-end' | 'bottom' | 'bottom-start' | 'bottom-end' | 'left' | 'left-start' | 'left-end'`

Used to specify the tooltip's placement with respect to its anchor.

-   Required: No
-   Default: `'bottom'`

#### `position`: `string`

_Note: use the `placement` prop instead when possible._

Legacy way to specify the popover's position with respect to its anchor. Specify y- and x-axis as a space-separated string. Supports `'top'`, `'middle'`, `'bottom'` y axis, and `'left'`, `'center'`, `'right'` x axis.

-   Required: No
-   Default: `'bottom'`

#### `shortcut`: `string` | `object`

An option for adding accessible keyboard shortcuts.

If shortcut is a string, it is expecting the display text. If shortcut is an object, it will accept the properties of `display`: `string` and `ariaLabel`: `string`.

-   Required: No

#### `text`: `string`

The text shown in the tooltip when anchor element is focused or hovered.

-   Required: No
