# BlockPopover

The BlockPopover component is a component that allows you to render editor UI by the block (in a popover) but outside the the canvas. This is important to avoid messing up with the style and layout of the block list.

For example, it's used to render the contextual block toolbar, the in-between block inserter.

### Props

#### clientId

The client ID of the block representing the top position of the popover.

-   Type: `String`
-   Required: Yes

#### bottomClientId

The client ID of the block representing the bottom position of the popover.

-   Type: `String`
-   Required: No