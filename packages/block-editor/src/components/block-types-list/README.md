# Block Types List

The `BlockTypesList` component lets users display a list of blocks in different interfaces or as a result of certain actions. It is also possible to select one of the blocks in the list to insert it into the editor.

This component is present in the block insertion tab, the reusable blocks tab and the quick block insertion modal in the editor.

![Block types list in the block inserter tab](https://make.wordpress.org/core/files/2020/09/block-types-list-emplacement-1.png)

![Block types list in the reusables blocks tab](https://make.wordpress.org/core/files/2020/09/block-types-list-emplacement-2.png)

![Block types list in the quick inserter modal](https://make.wordpress.org/core/files/2020/09/block-types-list-emplacement-3.png)


## Table of contents

1. [Development guidelines](#development-guidelines)
2. [Related components](#related-components)


## Development guidelines

### Usage

Renders a list of blocks types.

```jsx
import { Button } from '@wordpress/components';

const MyButton = () => <Button isSecondary>Click me!</Button>;
```

### Props

The presence of a `href` prop determines whether an `anchor` element is rendered instead of a `button`.

Props not included in this set will be applied to the `a` or `button` element.

#### disabled

Whether the button is disabled. If `true`, this will force a `button` element to be rendered.

-   Type: `Boolean`
-   Required: No
-   Default: `false`

#### href

If provided, renders `a` instead of `button`.

-   Type: `String`
-   Required: No
-   Default: `undefined`

#### isSecondary

Renders a default button style.

-   Type: `Boolean`
-   Required: No
-   Default: `false`

#### isPrimary

Renders a primary button style.

-   Type: `Boolean`
-   Required: No
-   Default: `false`

#### isTertiary

Renders a text-based button style.

-   Type: `Boolean`
-   Required: No
-   Default: `false`

#### isDestructive

Renders a red text-based button style to indicate destructive behavior.

-   Type: `Boolean`
-   Required: No
-   Default: `false`

#### isSmall

Decreases the size of the button.

-   Type: `Boolean`
-   Required: No
-   Default: `false`

#### isPressed

Renders a pressed button style.

-   Type: `Boolean`
-   Required: No
-   Default: `false`

#### isBusy

Indicates activity while a action is being performed.

-   Type: `Boolean`
-   Required: No
-   Default: `false`

#### isLink

Renders a button with an anchor style.

-   Type: `Boolean`
-   Required: No
-   Default: `false`

#### focus

Whether the button is focused.

-   Type: `Boolean`
-   Required: No
-   Default: `false`

#### target

If provided with `href`, sets the `target` attribute to the `a`.

-   Type: `String`
-   Required: No

#### className

An optional additional class name to apply to the rendered button.

-   Type: `String`
-   Required: No

#### icon

If provided, renders an [Icon](/packages/components/src/icon/README.md) component inside the button.

-   Type: `String|Function|WPComponent|null`
-   Required: No
-   Default: `null`

#### iconSize

If provided with `icon`, sets the icon size.

-   Type: `Number`
-   Required: No
-   Default: `20 when a Dashicon is rendered, 24 for all other icons.`

#### showTooltip

If provided, renders a [Tooltip](/packages/components/src/tooltip/README.md) component for the button.

-   Type: `Boolean`
-   Required: No
-   Default: `false`

#### tooltipPosition

If provided with`showTooltip`, sets the position of the tooltip.

-   Type: `String`
-   Require: No
-   Default:`top center`

#### shortcut

If provided with `showTooltip`, appends the Shortcut label to the tooltip content. If an `Object` is provided, it should contain `display` and `ariaLabel` keys.

-   Type: `String|Object`
-   Required: No
-   Default: `undefined`

#### label

Sets the `aria-label` of the component, if none is provided. Sets the Tooltip content if `showTooltip` is provided.

-   Type: `String`
-   Required: No

## Related components

-   To group buttons together, use the [ButtonGroup](/packages/components/src/button-group/README.md) component.
