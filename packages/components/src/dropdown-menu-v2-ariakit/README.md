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

The open state of the dropdown menu when it is initially rendered. Use when not wanting to control its open state.

- Required: no
- Default: `false`

##### `open`: `boolean`

The controlled open state of the dropdown menu. Must be used in conjunction with `onOpenChange`.

- Required: no

##### `onOpenChange`: `(open: boolean) => void`

Event handler called when the open state of the dropdown menu changes.

- Required: no

##### `modal`: `boolean`

The modality of the dropdown menu. When set to true, interaction with outside elements will be disabled and only menu content will be visible to screen readers.

- Required: no
- Default: `true`

##### `placement`: ``'top' | 'top-start' | 'top-end' | 'right' | 'right-start' | 'right-end' | 'bottom' | 'bottom-start' | 'bottom-end' | 'left' | 'left-start' | 'left-end'`

The placement of the dropdown menu popover.

- Required: no
- Default: `'bottom-start'` for root-level menus, `'right-start'` for nested menus

##### `gutter`: `number`

The distance in pixels from the trigger.

- Required: no
- Default: `8` for root-level menus, `16` for nested menus

##### `shift`: `number`

The skidding of the popover along the anchor element. Can be set to negative values to make the popover shift to the opposite side.

- Required: no
- Default: `0` for root-level menus, `-8` for nested menus

### `DropdownMenuItem`

Used to render a menu item.

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

- Required: no

##### `hideOnClick`: `boolean`

Whether to hide the dropdown menu when the menu item is clicked.

- Required: no
- Default: `true`

##### `disabled`: `boolean`

Determines if the element is disabled.

- Required: no
- Default: `false`

### `DropdownMenuCheckboxItem`

Used to render a checkbox item.

#### Props

The component accepts the following props:

##### `children`: `React.ReactNode`

The contents of the item

- Required: yes

##### `suffix`: `React.ReactNode`

The contents of the item's suffix.

- Required: no

##### `hideOnClick`: `boolean`

Whether to hide the dropdown menu when the menu item is clicked.

- Required: no
- Default: `false`

##### `disabled`: `boolean`

Determines if the element is disabled.

- Required: no
- Default: `false`

##### `name`: `string`

The checkbox item's name.

- Required: yes

##### `value`: `string`

The checkbox item's value, useful when using multiple checkbox items
 associated to the same `name`.

- Required: no

##### `checked`: `boolean`

The checkbox item's value, useful when using multiple checkbox items
 associated to the same `name`.

- Required: no

##### `defaultChecked`: `boolean`

The checked state of the checkbox menu item when it is initially rendered. Use when not wanting to control its checked state.

- Required: no

##### `onChange`: `( event: React.ChangeEvent< HTMLInputElement > ) => void;`

Event handler called when the checked state of the checkbox menu item changes.

- Required: no

### `DropdownMenuRadioItem`

Used to render a radio item.

#### Props

The component accepts the following props:

##### `children`: `React.ReactNode`

The contents of the item

- Required: yes

##### `suffix`: `React.ReactNode`

The contents of the item's suffix.

- Required: no

##### `hideOnClick`: `boolean`

Whether to hide the dropdown menu when the menu item is clicked.

- Required: no
- Default: `false`

##### `disabled`: `boolean`

Determines if the element is disabled.

- Required: no
- Default: `false`

##### `name`: `string`

The radio item's name.

- Required: yes

##### `value`: `string | number`

The radio item's value.

- Required: yes

##### `checked`: `boolean`

The checkbox item's value, useful when using multiple checkbox items
 associated to the same `name`.

- Required: no

##### `defaultChecked`: `boolean`

The checked state of the radio menu item when it is initially rendered. Use when not wanting to control its checked state.

- Required: no

##### `onChange`: `( event: React.ChangeEvent< HTMLInputElement > ) => void;`

Event handler called when the checked radio menu item changes.

- Required: no

### `DropdownMenuItemLabel`

Used to render the menu item's label.

#### Props

The component accepts the following props:

##### `children`: `React.ReactNode`

The label contents.

- Required: yes

### `DropdownMenuItemHelpText`

Used to render the menu item's help text.

#### Props

The component accepts the following props:

##### `children`: `React.ReactNode`

The help text contents.

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
