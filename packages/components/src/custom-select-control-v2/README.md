<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

### `CustomSelect`

Used to render a checkbox item.

#### Props

The component accepts the following props:

##### `children`: `React.ReactNode`

The child elements. This should be composed of CustomSelect.Item components.

-   Required: yes

##### `defaultValue`: `string | string[]`

An optional default value for the control. If left `undefined`, the first non-disabled item will be used.

-   Required: no

##### `label`: `string`

Label for the control.

-   Required: no

##### `onChange`: `( newValue: string | string[] ) => void`

A function that receives the new value of the input.

-   Required: no

##### `styledValue`: `( selectValue: string | string[] ) => React.ReactNode`

Can be used to render select UI with custom styled values.

-   Required: no

##### `size`: `'default' | 'large'`

The size of the control.

-   Required: no

##### `value`: `string | string[]`

Can be used to externally control the value of the control.

-   Required: no

### `CustomSelectItemProps`

Used to render a select item.

#### Props

The component accepts the following props:

##### `children`: `React.ReactNode`

The children to display for each select item.

-   Required: no

##### `value`: `string | string[]`

The value of the select item. This will be used as the children if children are left `undefined`.

-   Required: yes
