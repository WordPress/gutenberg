# CustomSelect

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

Used to render a customizable select control component.

## Development guidelines

### Usage

#### Uncontrolled Mode

CustomSelect can be used in an uncontrolled mode, where the component manages its own state. In this mode, the `defaultValue` prop can be used to set the initial selected value. If this prop is not set, the first value from the children will be selected by default.

```jsx
const UncontrolledCustomSelect = () => (
	<CustomSelect label="Colors">
		<CustomSelectItem value="Blue">
			{ /* The `defaultValue` since it wasn't defined */ }
			<span style={ { color: 'blue' } }>Blue</span>
		</CustomSelectItem>
		<CustomSelectItem value="Purple">
			<span style={ { color: 'purple' } }>Purple</span>
		</CustomSelectItem>
		<CustomSelectItem value="Pink">
			<span style={ { color: 'deeppink' } }>Pink</span>
		</CustomSelectItem>
	</CustomSelect>
);
```

#### Controlled Mode

CustomSelect can also be used in a controlled mode, where the parent component specifies the `value` and the `onChange` props to control selection.

```jsx
const ControlledCustomSelect = () => {
	const [ value, setValue ] = useState< string | string[] >();

    const renderControlledValue = ( renderValue: string | string[] ) => (
		<>
			{ /* Custom JSX to display `renderValue` item */ }
		</>
    );

	return (
		<CustomSelect
			{ ...props }
			onChange={ ( nextValue ) => {
				setValue( nextValue );
				props.onChange?.( nextValue );
			} }
			value={ value }
		>
			{ [ 'blue', 'purple', 'pink' ].map( ( option ) => (
				<CustomSelectItem key={ option } value={ option }>
					{ renderControlledValue( option ) }
				</CustomSelectItem>
			) ) }
		</CustomSelect>
	);
};
```

#### Multiple Selection

Multiple selection can be enabled by using an array for the `value` and
`defaultValue` props. The argument of the `onChange` function will also change accordingly.

```jsx
const MultiSelectCustomSelect = () => (
	<CustomSelect defaultValue={ [ 'blue', 'pink' ] } label="Colors">
		{ [ 'blue', 'purple', 'pink' ].map( ( item ) => (
			<CustomSelectItem key={ item } value={ item }>
				{ item }
			</CustomSelectItem>
		) ) }
	</CustomSelect>
);
```

### Components and Sub-components

CustomSelect is comprised of two individual components:

-   `CustomSelect`: a wrapper component and context provider. It is responsible for managing the state of the `CustomSelectItem` children.
-   `CustomSelectItem`: renders a single select item. The first `CustomSelectItem` child will be used as the `defaultValue` when `defaultValue` is undefined.

#### Props

The component accepts the following props:

##### `children`: `React.ReactNode`

The child elements. This should be composed of CustomSelect.Item components.

-   Required: yes

##### `defaultValue`: `string | string[]`

An optional default value for the control. If left `undefined`, the first non-disabled item will be used.

-   Required: no

##### `hideLabelFromVision`: `boolean`

Used to visually hide the label. It will always be visible to screen readers.

-   Required: no
-   Default: `false`

##### `label`: `string`

Label for the control.

-   Required: yes

##### `onChange`: `( newValue: string | string[] ) => void`

A function that receives the new value of the input.

-   Required: no

##### `renderSelectedValue`: `( selectValue: string | string[] ) => React.ReactNode`

Can be used to render select UI with custom styled values.

-   Required: no

##### `size`: `'default' | 'compact'`

The size of the control.

-   Required: no
-   Default: `'default'`

##### `value`: `string | string[]`

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
