# Menu

<!-- This file is generated automatically and cannot be edited directly. Make edits via TypeScript types and TSDocs. -->

🔒 This component is locked as a [private API](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-private-apis/). We do not yet recommend using this outside of the Gutenberg project.

<p class="callout callout-info">See the <a href="https://wordpress.github.io/gutenberg/?path=/docs/components-menu--docs">WordPress Storybook</a> for more detailed, interactive documentation.</p>

Menu is a collection of React components that combine to render
ARIA-compliant [menu](https://www.w3.org/WAI/ARIA/apg/patterns/menu/) and
[menu button](https://www.w3.org/WAI/ARIA/apg/patterns/menubutton/) patterns.

`Menu` itself is a wrapper component and context provider.
It is responsible for managing the state of the menu and its items, and for
rendering the `Menu.TriggerButton` (or the `Menu.SubmenuTriggerItem`)
component, and the `Menu.Popover` component.

## Props

### `as`

 - Type: `"symbol" | "object" | "a" | "abbr" | "address" | "area" | "article" | "aside" | "audio" | "b" | "base" | "bdi" | "bdo" | "big" | "blockquote" | "body" | "br" | "button" | "canvas" | ... 516 more ... | ("view" & FunctionComponent<...>)`
 - Required: No

The HTML element or React component to render the component as.

### `children`

 - Type: `ReactNode`
 - Required: No

The elements, which should include one instance of the `Menu.TriggerButton`
component and one instance of the `Menu.Popover` component.

### `defaultOpen`

 - Type: `boolean`
 - Required: No
 - Default: `false`

Whether the menu popover and its contents should be visible by default.

Note: this prop will be overridden by the `open` prop if it is
provided (meaning the component will be used in "controlled" mode).

### `open`

 - Type: `boolean`
 - Required: No

Whether the menu popover and its contents should be visible.
Should be used in conjunction with `onOpenChange` in order to control
the open state of the menu popover.

Note: this prop will set the component in "controlled" mode, and it will
override the `defaultOpen` prop.

### `onOpenChange`

 - Type: `(open: boolean) => void`
 - Required: No

A callback that gets called when the `open` state changes.

### `placement`

 - Type: `"top" | "bottom" | "left" | "right" | "top-start" | "bottom-start" | "left-start" | "right-start" | "top-end" | "bottom-end" | ...`
 - Required: No
 - Default: `'bottom-start' for root-level menus, 'right-start' for submenus`

The placement of the menu popover.

## Subcomponents

### Menu.TriggerButton

Renders a menu button that toggles the visibility of a sibling
`Menu.Popover` component when clicked or when using arrow keys.

#### Props

##### `accessibleWhenDisabled`

 - Type: `boolean`
 - Required: No

Indicates whether the element should be focusable even when it is
`disabled`.

This is important when discoverability is a concern. For example:

> A toolbar in an editor contains a set of special smart paste functions
that are disabled when the clipboard is empty or when the function is not
applicable to the current content of the clipboard. It could be helpful to
keep the disabled buttons focusable if the ability to discover their
functionality is primarily via their presence on the toolbar.

Learn more on [Focusability of disabled
controls](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#focusabilityofdisabledcontrols).

##### `children`

 - Type: `ReactNode`
 - Required: No

The contents of the menu trigger button.

##### `disabled`

 - Type: `boolean`
 - Required: No
 - Default: `false`

Determines if the element is disabled. This sets the `aria-disabled`
attribute accordingly, enabling support for all elements, including those
that don't support the native `disabled` attribute.

This feature can be combined with the `accessibleWhenDisabled` prop to
make disabled elements still accessible via keyboard.

##### `render`

 - Type: `ReactElement<any, string | JSXElementConstructor<any>> | RenderProp<HTMLAttributes<any> & { ref?: Ref<any>; }>`
 - Required: No

Allows the component to be rendered as a different HTML element or React
component. The value can be a React element or a function that takes in the
original component props and gives back a React element with the props
merged.

### Menu.Popover

Renders a dropdown menu element that's controlled by a sibling
`Menu.TriggerButton` component. It renders a popover and automatically
focuses on items when the menu is shown.

The only valid children of `Menu.Popover` are `Menu.Item`,
`Menu.RadioItem`, `Menu.CheckboxItem`, `Menu.Group`, `Menu.Separator`,
and `Menu` (for nested dropdown menus).

#### Props

##### `children`

 - Type: `ReactNode`
 - Required: No

The contents of the menu popover, which should include instances of the
`Menu.Item`, `Menu.CheckboxItem`, `Menu.RadioItem`, `Menu.Group`, and
`Menu.Separator` components.

##### `gutter`

 - Type: `number`
 - Required: No
 - Default: `8 for root-level menus, 16 for nested menus`

The distance between the popover and the anchor element.

##### `hideOnEscape`

 - Type: `BooleanOrCallback<KeyboardEvent | React.KeyboardEvent<Element>>`
 - Required: No
 - Default: ``( event ) => { event.preventDefault(); return true; }``

Determines if the menu popover will hide when the user presses the
Escape key.

This prop can be either a boolean or a function that accepts an event as an
argument and returns a boolean. The event object represents the keydown
event that initiated the hide action, which could be either a native
keyboard event or a React synthetic event.

##### `modal`

 - Type: `boolean`
 - Required: No
 - Default: `true`

The modality of the menu popover. When set to true, interaction with
outside elements will be disabled and only menu content will be visible to
screen readers.

Determines whether the menu popover is modal. Modal dialogs have distinct
states and behaviors:
- The `portal` and `preventBodyScroll` props are set to `true`. They can
  still be manually set to `false`.
- When the dialog is open, element tree outside it will be inert.

##### `shift`

 - Type: `number`
 - Required: No
 - Default: `0 for root-level menus, -8 for nested menus`

The skidding of the popover along the anchor element. Can be set to
negative values to make the popover shift to the opposite side.

### Menu.Item

Renders a menu item inside the `Menu.Popover` or `Menu.Group` components.

It can optionally contain one instance of the `Menu.ItemLabel` component
and one instance of the `Menu.ItemHelpText` component.

#### Props

##### `children`

 - Type: `ReactNode`
 - Required: Yes

The contents of the menu item, which could include one instance of the
`Menu.ItemLabel` component and/or one instance of the `Menu.ItemHelpText`
component.

##### `disabled`

 - Type: `boolean`
 - Required: No
 - Default: `false`

Determines if the element is disabled. This sets the `aria-disabled`
attribute accordingly, enabling support for all elements, including those
that don't support the native `disabled` attribute.

##### `hideOnClick`

 - Type: `BooleanOrCallback<MouseEvent<HTMLElement, MouseEvent>>`
 - Required: No
 - Default: `true`

Determines if the menu should hide when this item is clicked.

**Note**: This behavior isn't triggered if this menu item is rendered as a
link and modifier keys are used to either open the link in a new tab or
download it.

##### `prefix`

 - Type: `ReactNode`
 - Required: No

The contents of the menu item's prefix, such as an icon.

##### `render`

 - Type: `ReactElement<any, string | JSXElementConstructor<any>> | RenderProp<HTMLAttributes<any> & { ref?: Ref<any>; }>`
 - Required: No

Allows the component to be rendered as a different HTML element or React
component. The value can be a React element or a function that takes in the
original component props and gives back a React element with the props
merged.

##### `suffix`

 - Type: `ReactNode`
 - Required: No

The contents of the menu item's suffix, such as a keyboard shortcut.

### Menu.RadioItem

Renders a radio menu item inside the `Menu.Popover` or `Menu.Group`
components.

It can optionally contain one instance of the `Menu.ItemLabel` component
and one instance of the `Menu.ItemHelpText` component.

#### Props

##### `children`

 - Type: `ReactNode`
 - Required: Yes

The contents of the menu item, which could include one instance of the
`Menu.ItemLabel` component and/or one instance of the `Menu.ItemHelpText`
component.

##### `checked`

 - Type: `boolean`
 - Required: No

The controlled checked state of the radio menu item.

Note: this prop will override the `defaultChecked` prop.

##### `disabled`

 - Type: `boolean`
 - Required: No
 - Default: `false`

Determines if the element is disabled. This sets the `aria-disabled`
attribute accordingly, enabling support for all elements, including those
that don't support the native `disabled` attribute.

##### `defaultChecked`

 - Type: `boolean`
 - Required: No

The checked state of the radio menu item when it is initially rendered.
Use when not wanting to control its checked state.

Note: this prop will be overriden by the `checked` prop, if it is defined.

##### `hideOnClick`

 - Type: `BooleanOrCallback<MouseEvent<HTMLElement, MouseEvent>>`
 - Required: No
 - Default: `false`

Determines if the menu should hide when this item is clicked.

**Note**: This behavior isn't triggered if this menu item is rendered as a
link and modifier keys are used to either open the link in a new tab or
download it.

##### `name`

 - Type: `string`
 - Required: Yes

The radio item's name.

##### `onChange`

 - Type: `BivariantCallback<(event: ChangeEvent<HTMLInputElement>) => void>`
 - Required: No

A function that is called when the checkbox's checked state changes.

##### `render`

 - Type: `ReactElement<any, string | JSXElementConstructor<any>> | RenderProp<HTMLAttributes<any> & { ref?: Ref<any>; }>`
 - Required: No

Allows the component to be rendered as a different HTML element or React
component. The value can be a React element or a function that takes in the
original component props and gives back a React element with the props
merged.

##### `suffix`

 - Type: `ReactNode`
 - Required: No

The contents of the menu item's suffix, such as a keyboard shortcut.

##### `value`

 - Type: `string | number`
 - Required: Yes

The radio item's value.

### Menu.CheckboxItem

Renders a checkbox menu item inside the `Menu.Popover` or `Menu.Group`
components.

It can optionally contain one instance of the `Menu.ItemLabel` component
and one instance of the `Menu.ItemHelpText` component.

#### Props

##### `children`

 - Type: `ReactNode`
 - Required: Yes

The contents of the menu item, which could include one instance of the
`Menu.ItemLabel` component and/or one instance of the `Menu.ItemHelpText`
component.

##### `checked`

 - Type: `boolean`
 - Required: No

The controlled checked state of the checkbox menu item.

Note: this prop will override the `defaultChecked` prop.

##### `disabled`

 - Type: `boolean`
 - Required: No
 - Default: `false`

Determines if the element is disabled. This sets the `aria-disabled`
attribute accordingly, enabling support for all elements, including those
that don't support the native `disabled` attribute.

##### `defaultChecked`

 - Type: `boolean`
 - Required: No

The checked state of the checkbox menu item when it is initially rendered.
Use when not wanting to control its checked state.

Note: this prop will be overriden by the `checked` prop, if it is defined.

##### `hideOnClick`

 - Type: `BooleanOrCallback<MouseEvent<HTMLElement, MouseEvent>>`
 - Required: No
 - Default: `false`

Determines if the menu should hide when this item is clicked.

**Note**: This behavior isn't triggered if this menu item is rendered as a
link and modifier keys are used to either open the link in a new tab or
download it.

##### `name`

 - Type: `string`
 - Required: Yes

The checkbox menu item's name.

##### `onChange`

 - Type: `ChangeEventHandler<HTMLInputElement>`
 - Required: No

A function that is called when the checkbox's checked state changes.

##### `render`

 - Type: `ReactElement<any, string | JSXElementConstructor<any>> | RenderProp<HTMLAttributes<any> & { ref?: Ref<any>; }>`
 - Required: No

Allows the component to be rendered as a different HTML element or React
component. The value can be a React element or a function that takes in the
original component props and gives back a React element with the props
merged.

##### `suffix`

 - Type: `ReactNode`
 - Required: No

The contents of the menu item's suffix, such as a keyboard shortcut.

##### `value`

 - Type: `string | number | readonly string[]`
 - Required: No

The checkbox item's value, useful when using multiple checkbox menu items
associated to the same `name`.

### Menu.ItemLabel

Renders a menu item's label text. It should be wrapped with `Menu.Item`,
`Menu.RadioItem`, or `Menu.CheckboxItem`.

#### Props

##### `as`

 - Type: `"symbol" | "object" | "a" | "abbr" | "address" | "area" | "article" | "aside" | "audio" | "b" | ...`
 - Required: No

The HTML element or React component to render the component as.

### Menu.ItemHelpText

Renders a menu item's help text. It should be wrapped with `Menu.Item`,
`Menu.RadioItem`, or `Menu.CheckboxItem`.

#### Props

##### `as`

 - Type: `"symbol" | "object" | "a" | "abbr" | "address" | "area" | "article" | "aside" | "audio" | "b" | ...`
 - Required: No

The HTML element or React component to render the component as.

### Menu.Group

Renders a group for menu items.

It should contain one instance of `Menu.GroupLabel` and one or more
instances of `Menu.Item`, `Menu.RadioItem`, or `Menu.CheckboxItem`.

#### Props

##### `children`

 - Type: `ReactNode`
 - Required: Yes

The contents of the menu group, which should include one instance of the
`Menu.GroupLabel` component and one or more instances of `Menu.Item`,
`Menu.CheckboxItem`, and `Menu.RadioItem`.

### Menu.GroupLabel

Renders a label in a menu group.

This component should be wrapped with `Menu.Group` so the
`aria-labelledby` is correctly set on the group element.

#### Props

##### `children`

 - Type: `ReactNode`
 - Required: Yes

The contents of the menu group label, which should provide an accessible
label for the menu group.

### Menu.Separator

Renders a divider between menu items or menu groups.

#### Props

### Menu.SubmenuTriggerItem

Renders a menu item that toggles the visibility of a sibling
`Menu.Popover` component when clicked or when using arrow keys.

This component is used to create a nested dropdown menu.

#### Props

##### `children`

 - Type: `ReactNode`
 - Required: Yes

The contents of the menu item, which could include one instance of the
`Menu.ItemLabel` component and/or one instance of the `Menu.ItemHelpText`
component.

##### `disabled`

 - Type: `boolean`
 - Required: No
 - Default: `false`

Determines if the element is disabled. This sets the `aria-disabled`
attribute accordingly, enabling support for all elements, including those
that don't support the native `disabled` attribute.

##### `hideOnClick`

 - Type: `BooleanOrCallback<MouseEvent<HTMLElement, MouseEvent>>`
 - Required: No
 - Default: `true`

Determines if the menu should hide when this item is clicked.

**Note**: This behavior isn't triggered if this menu item is rendered as a
link and modifier keys are used to either open the link in a new tab or
download it.

##### `prefix`

 - Type: `ReactNode`
 - Required: No

The contents of the menu item's prefix, such as an icon.

##### `render`

 - Type: `ReactElement<any, string | JSXElementConstructor<any>> | RenderProp<HTMLAttributes<any> & { ref?: Ref<any>; }>`
 - Required: No

Allows the component to be rendered as a different HTML element or React
component. The value can be a React element or a function that takes in the
original component props and gives back a React element with the props
merged.

##### `suffix`

 - Type: `ReactNode`
 - Required: No

The contents of the menu item's suffix, such as a keyboard shortcut.
