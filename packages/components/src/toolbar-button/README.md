# ToolbarButton

A ToolbarButton can be used to add actions to your block control, usually inside a ToolbarGroup. It has the same features of the [Button](https://developer.wordpress.org/block-editor/components/button/) component, only its style is more appropriate for a Toolbar.

## Usage

```jsx
import { ToolbarButton } from "@wordpress/components";
import { edit } from "@wordpress/icons";
 
const MyToolbarButton = () => (
    <MyToolbarButton
        title="Edit"
        icon={ edit }
        onClick={ onEdit } />
);
```

## Props

This component accepts [the same API of the Button](https://developer.wordpress.org/block-editor/components/button/#props) component.

## Related components

* If you wish to implement a control do select options grouped as icon buttons you can use the [Toolbar](https://developer.wordpress.org/block-editor/components/toolbar/) component, which already handles this strategy.
* The ToolbarButton may be used with other elements such as [Dropdown](https://developer.wordpress.org/block-editor/components/dropdown/) to display options in a popover.