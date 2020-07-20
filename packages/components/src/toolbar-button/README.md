# ToolbarButton

A ToolbarButton can be used to add actions to your block control, usually inside a ToolbarGroup. It has similar features to the [Button](/packages/components/src/button/README.md) component. Using `ToolbarButton` will ensure the correct styling for a button in a toolbar, and also that keyboard interactions in a toolbar are consistent with the [WAI ARIA toolbar pattern](https://www.w3.org/TR/wai-aria-practices/#toolbar).

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

This component accepts [the same API of the Button](/packages/components/src/button/README.md#props) component.

## Related components

* If you wish to implement a control to select options grouped as icon buttons you can use the [Toolbar](/packages/components/src/toolbar/README.md) component, which already handles this strategy.
* The ToolbarButton may be used with other elements such as [Dropdown](/packages/components/src/dropdown/README.md) to display options in a popover.
