# ActionItem

`ActionItem` is a component that implements a slot & fill pair used in situations where we have a container that will contain several possible actions e.g: a button group that will contain several buttons or a menu that will contain several menu items.

## ActionItem.Slot

Renders nothing when no fill is present. The props not referred below are passed to the container component.

## Props

### name

The name of the slot and fill pair passed to the `Slot` component.

-   Type: `String`
-   Required: Yes

### as

The component used as the container of the fills. Defaults to the `MenuGroup` component.

-   Type: `Component`
-   Required: no
-   Default: `MenuGroup`

### fillProps

Props passed to every fill. An `as` among them provides the component the items render as, unless the item asks for one of its own.

-   Type: `Object`
-   Required: no

### children

A function receiving the rendered fills as a flat array. Use it when the container has to wrap each fill rather than just group them. Takes precedence over `as`.

-   Type: `Function`
-   Required: no

## ActionItem

The props not referred below are passed to the item component.

### name

The name of the slot and fill pair passed to the `Fill` component.

-   Type: `String`
-   Required: Yes

### onClick

Callback function executed when a click on the item happens.

-   Type: `Function`
-   Required: no

### as

The component that is going to be used to render an action item. Defaults to the `as` the slot provides through `fillProps`, or to the `MenuItem` component, so that it nests in the `MenuGroup` the slot renders by default.

-   Type: `Component`
-   Required: no
-   Default: `MenuItem`
