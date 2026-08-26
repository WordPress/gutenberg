# BlockPopover and BlockPopoverInbetween

These two components allow rendering editor UI by the block (in a popover) but outside the canvas. This is important to avoid messing with the style and layout of the block list.

For example, it's used to render the contextual block toolbar and the in-between block inserter.

## BlockPopover

### Props

#### clientId

The client ID of the block representing the top position of the popover.

-   Type: `String`
-   Required: Yes

#### bottomClientId

The client ID of the block representing the bottom position of the popover.

-   Type: `String`
-   Required: No

#### shift

This determines whether the block popover always shifts into the viewport or remains at its original position. See FloatingUI for more details on shift.

-   Type: `Boolean`
-   Required: No
-   Default: `true`

#### children

The content rendered inside the popover.

-   Type: `ReactNode`
-   Required: No

## BlockPopoverInbetween - Private Component

### Props

#### previousClientId

The client ID of the block before the popover.

-   Type: `String`
-   Required: Yes

#### nextClientId

The client ID of the block after the popover.

-   Type: `String`
-   Required: Yes

#### alwaysVisible

By default, the popover is only rendered while `previousClientId` and `nextClientId` are both scrolled into view, so that mounting many of these at once (e.g. the default in-between inserter) doesn't do unnecessary off-screen work. Pass `true` when a caller only ever mounts a single instance and needs it to stay reachable (e.g. focusable via keyboard) regardless of scroll position, such as the Zoom Out mode inserter.

-   Type: `Boolean`
-   Required: No
-   Default: `false`
