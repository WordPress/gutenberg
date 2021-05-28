# ControlGroup

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

`ControlGroup` is a layout-based component for rendering a group of control-based components, such as `Button`, `Select` or `TextInput`. Control components that render within `ControlGroup` automatically have their borders offset and border-radii rounded.

## Usage

```jsx
import { Button, ControlGroup, Select, TextInput } from `@wordpress/components/ui`

function Example() {
    return (
        <ControlGroup templateColumns="auto 1fr auto">
            <Select />
            <TextInput placeholder="First name" />
            <Button variant="primary" />
        </ControlGroup>
    );
}
```
