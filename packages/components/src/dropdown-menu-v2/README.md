# `DropdownMenu` (v2)

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

`DropdownMenu` displays a menu to the user (such as a set of actions or functions) triggered by a button.


## Design guidelines

### Usage

#### When to use a DropdownMenu

Use a DropdownMenu when you want users to:

-   Choose an action or change a setting from a list, AND
-   Only see the available choices contextually.

`DropdownMenu` is a React component to render an expandable menu of buttons. It is similar in purpose to a `<select>` element, with the distinction that it does not maintain a value. Instead, each option behaves as an action button.

If you need to display all the available options at all times, consider using a Toolbar instead. Use a `DropdownMenu` to display a list of actions after the user interacts with a button.

**Do**
Use a `DropdownMenu` to display a list of actions after the user interacts with an icon.

**Don’t** use a `DropdownMenu` for important actions that should always be visible. Use a `Toolbar` instead.

**Don’t**
Don’t use a `DropdownMenu` for frequently used actions. Use a `Toolbar` instead.

#### Behavior

Generally, the parent button should indicate that interacting with it will show a `DropdownMenu`.

The parent button should retain the same visual styling regardless of whether the `DropdownMenu` is displayed or not.

#### Placement

The `DropdownMenu` should typically appear directly below, or below and to the left of, the parent button. If there isn’t enough space below to display the full `DropdownMenu`, it can be displayed instead above the parent button.

## Development guidelines

This component is still highly experimental, and it's not normally accessible to consumers of the `@wordpress/components` package.

The component exposes a set of components that are meant to be used in combination with each other in order to implement a `DropdownMenu` correctly.

### `DropdownMenu`

The root component, used to specify the menu's trigger and its contents.

#### Props

The component accepts the following props:

##### `trigger`: `React.ReactNode`

The trigger button

- Required: yes

##### `children`: `React.ReactNode`

The contents of the dropdown

- Required: yes

##### `defaultOpen`: `boolean`

The open state of the dropdown menu when it is initially rendered. Use when you do not need to control its open state.

- Required: no

##### `open`: `boolean`

The controlled open state of the dropdown menu. Must be used in conjunction with `onOpenChange`

- Required: no

##### `onOpenChange`: `(open: boolean) => void`

Event handler called when the open state of the dropdown menu changes.

- Required: no

##### `modal`: `boolean`

The modality of the dropdown menu. When set to true, interaction with outside elements will be disabled and only menu content will be visible to screen readers.

- Required: no
- Default: `true`

##### `side`: `"bottom" | "left" | "right" | "top"`

The preferred side of the trigger to render against when open. Will be reversed when collisions occur and avoidCollisions is enabled.

- Required: no
- Default: `"bottom"`

##### `sideOffset`: `number`

The distance in pixels from the trigger.

- Required: no
- Default: `0`

##### `align`: `"end" | "start" | "center"`

The preferred alignment against the trigger. May change when collisions occur.

- Required: no
- Default: `"start"`

##### `alignOffset`: `number`

An offset in pixels from the "start" or "end" alignment options.

- Required: no
- Default: `0`

### `DropdownMenuItem`

Used to render a menu item.

#### Props

The component accepts the following props:

##### `children`: `React.ReactNode`

The contents of the item

- Required: yes

##### `disabled`: `boolean`

- Required: no
- Default: `false`

##### `onSelect`: `(event: Event) => void`

Event handler called when the user selects an item (via mouse or keyboard). Calling `event.preventDefault` in this handler will prevent the dropdown menu from closing when selecting that item.

- Required: no

##### `textValue`: `string`

Optional text used for typeahead purposes. By default the typeahead behavior will use the `.textContent` of the item. Use this when the content is complex, or you have non-textual content inside.

- Required: no

##### `prefix`: `React.ReactNode`

The contents of the item's prefix.

- Required: no

##### `suffix`: `React.ReactNode`

The contents of the item's suffix.

- Required: no

### `DropdownSubMenu`

Used to render a nested submenu.

#### Props

The component accepts the following props:
##### `trigger`: `React.ReactNode`

The contents rendered inside the trigger. The trigger should be an instance of the `DropdownSubMenuTrigger` component.

- Required: yes

##### `children`: `React.ReactNode`

The contents of the dropdown

- Required: yes

##### `defaultOpen`: `boolean`

The open state of the dropdown menu when it is initially rendered. Use when you do not need to control its open state.

- Required: no

##### `open`: `boolean`

The controlled open state of the dropdown menu. Must be used in conjunction with `onOpenChange`

- Required: no

##### `onOpenChange`: `(open: boolean) => void`

Event handler called when the open state of the dropdown menu changes.

- Required: no

##### `disabled`: `boolean`

When `true`, prevents the user from interacting with the item.

- Required: no

##### `textValue`: `string`

Optional text used for typeahead purposes for the trigger. By default the typeahead behavior will use the `.textContent` of the trigger. Use this when the content is complex, or you have non-textual content inside.

- Required: no

### `DropdownSubMenuTrigger`

Used to render a submenu trigger.

#### Props

The component accepts the following props:

##### `children`: `React.ReactNode`

The contents of the item

- Required: yes

##### `prefix`: `React.ReactNode`

The contents of the item's prefix.

- Required: no

##### `suffix`: `React.ReactNode`

The contents of the item's suffix.

- Default: a chevron icon
- Required: The standard chevron icon for a submenu trigger

### `DropdownMenuCheckboxItem`

Used to render a checkbox item.

#### Props

The component accepts the following props:

##### `children`: `React.ReactNode`

The contents of the checkbox item

- Required: yes

##### `checked`: `boolean`

The controlled checked state of the item. Must be used in conjunction with `onCheckedChange`.

- Required: no
- Default: `false`

##### `onCheckedChange`: `(checked: boolean) => void)`

Event handler called when the checked state changes.

- Required: no

##### `disabled`: `boolean`

When `true`, prevents the user from interacting with the item.

- Required: no

##### `onSelect`: `(event: Event) => void`

Event handler called when the user selects an item (via mouse or keyboard). Calling `event.preventDefault` in this handler will prevent the dropdown menu from closing when selecting that item.

- Required: no

##### `textValue`: `string`

Optional text used for typeahead purposes. By default the typeahead behavior will use the `.textContent` of the item. Use this when the content is complex, or you have non-textual content inside.

- Required: no

##### `suffix`: `React.ReactNode`

The contents of the checkbox item's suffix.

- Required: no

### `DropdownMenuRadioGroup`

Used to render a radio group.

#### Props

The component accepts the following props:

##### `children`: `React.ReactNode`

The contents of the radio group

- Required: yes

##### `value`: `string`

The value of the selected item in the group.

- Required: no

##### `onValueChange`: `(value: string) => void`

Event handler called when the value changes.

- Required: no

### `DropdownMenuRadioItem`

Used to render a radio item.

#### Props

The component accepts the following props:

##### `children`: `React.ReactNode`

The contents of the item.

- Required: yes

##### `value`: `string`

The unique value of the item.

- Required: yes

##### `disabled`: `boolean`

When `true`, prevents the user from interacting with the item.

- Required: no

##### `onSelect`: `(event: Event) => void`

Event handler called when the user selects an item (via mouse or keyboard). Calling `event.preventDefault` in this handler will prevent the dropdown menu from closing when selecting that item.

- Required: no

##### `textValue`: `string`

Optional text used for typeahead purposes. By default the typeahead behavior will use the `.textContent` of the item. Use this when the content is complex, or you have non-textual content inside.

- Required: no

##### `suffix`: `React.ReactNode

The contents of the radio item's suffix.

- Required: no

### `DropdownMenuLabel`

Used to render a group label.

#### Props

The component accepts the following props:

##### `children`: `React.ReactNode`

The contents of the group.

- Required: yes

### `DropdownMenuGroup`

Used to group menu items.

#### Props

The component accepts the following props:

##### `children`: `React.ReactNode`

The contents of the group.

- Required: yes

### `DropdownMenuSeparatorProps`

Used to render a visual separator.
