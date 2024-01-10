<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

### `CustomSelect`

Used to render a customizable select control component.

#### Props

The component accepts the following props:

##### `children`: `React.ReactNode`

The child elements. This should be composed of CustomSelect.Item components.

-   Required: yes

##### `defaultValue`: `string`

An optional default value for the control. If left `undefined`, the first non-disabled item will be used.

-   Required: no

##### `hideLabelFromVision`: `boolean`

If true, the label will only be visible to screen readers.

-   Required: no
-   Default: `false`

##### `label`: `string`

Label for the control.

-   Required: yes

##### `onChange`: `( newValue: string ) => void`

A function that receives the new value of the input.

-   Required: no

##### `popoverProps`: `Object`

Optional props passed to the Ariakit Select Popover.

-   Required: no

##### `renderSelectedValue`: `( selectValue: string ) => React.ReactNode`

Can be used to render select UI with custom styled values.

-   Required: no

##### `size`: `'default' | 'large'`

The size of the control.

-   Required: no

##### `value`: `string`

Can be used to externally control the value of the control.

-   Required: no

### `CustomSelectItem`

Used to render a select item.

#### Props

The component accepts the following props:

##### `value`: `string`

The value of the select item. This will be used as the children if children are left `undefined`.

-   Required: yes

##### `children`: `React.ReactNode`

The children to display for each select item. The `value` will be used if left `undefined`.

-   Required: no
