ActionItem
=============================

`ActionItem` is a component that implements a slot & fill pair used in situations where we have a container that will contain several possible actions e.g: a button group that will contain several buttons or a menu that will contain several menu items.

## ActionItem.Slot

The props not referred below are passed to the container component.

## Props

### name

The name of the slot and fill pair passed to the `Slot` component.

- Type: `String`
- Required: Yes

### bubblesVirtually

Property used to change the event bubbling behavior, passed to the `Slot` component.

- Type: `boolean`
- Required: no

### as

An array of two components the first is the component used on the container of the fills and the second is the component used to render each fill.
Defaults to `ButtonGroup` and `Button`can be changed to `MenuGroup` and `MenuItem`for example.

- Type: `Array`
- Required: no

## ActionItem

The props not referred below are passed to the item component.

### name

The name of the slot and fill pair passed to the `Fill` component.

- Type: `String`
- Required: Yes

### onClick

Callback function executed when a click on the item happens.

- Type: `Function`
- Required: no

### as

The component that is going to be used to render a the action item. If the component is not passed it defaults to the component specified on the slot.

- Type: `Array`
- Required: no

