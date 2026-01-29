# CustomSelectControlV2

Used to render a customizable select control component.

## Development guidelines

### Usage

#### Uncontrolled Mode

`CustomSelectControlV2` can be used in an uncontrolled mode, where the component manages its own state. In this mode, the `defaultValue` prop can be used to set the initial selected value. If this prop is not set, the first value from the children will be selected by default.

```jsx
const UncontrolledCustomSelectControlV2 = () => (
	<CustomSelectControlV2 label="Colors">
		<CustomSelectControlV2.Item value="Blue">
			{ /* The `defaultValue` since it wasn't defined */ }
			<span style={ { color: 'blue' } }>Blue</span>
		</CustomSelectControlV2.Item>
		<CustomSelectControlV2.Item value="Purple">
			<span style={ { color: 'purple' } }>Purple</span>
		</CustomSelectControlV2.Item>
		<CustomSelectControlV2.Item value="Pink">
			<span style={ { color: 'deeppink' } }>Pink</span>
		</CustomSelectControlV2.Item>
	</CustomSelectControlV2>
);
```

#### Controlled Mode

`CustomSelectControlV2` can also be used in a controlled mode, where the parent component specifies the `value` and the `onChange` props to control selection.

```jsx
const ControlledCustomSelectControlV2 = () => {
	const [ value, setValue ] = useState< string | string[] >();

    const renderControlledValue = ( renderValue: string | string[] ) => (
		<>
			{ /* Custom JSX to display `renderValue` item */ }
		</>
    );

	return (
		<CustomSelectControlV2
			{ ...props }
			onChange={ ( nextValue ) => {
				setValue( nextValue );
				props.onChange?.( nextValue );
			} }
			value={ value }
		>
			{ [ 'blue', 'purple', 'pink' ].map( ( option ) => (
				<CustomSelectControlV2.Item key={ option } value={ option }>
					{ renderControlledValue( option ) }
				</CustomSelectControlV2.Item>
			) ) }
		</CustomSelectControlV2>
	);
};
```

#### Multiple Selection

Multiple selection can be enabled by using an array for the `value` and
`defaultValue` props. The argument of the `onChange` function will also change accordingly.

```jsx
const MultiSelectCustomSelectControlV2 = () => (
	<CustomSelectControlV2 defaultValue={ [ 'blue', 'pink' ] } label="Colors">
		{ [ 'blue', 'purple', 'pink' ].map( ( item ) => (
			<CustomSelectControlV2.Item key={ item } value={ item }>
				{ item }
			</CustomSelectControlV2.Item>
		) ) }
	</CustomSelectControlV2>
);
```

### Components and Sub-components

`CustomSelectControlV2` is comprised of two individual components:

-   `CustomSelectControlV2`: a wrapper component and context provider. It is responsible for managing the state of the `CustomSelectControlV2.Item` children.
-   `CustomSelectControlV2.Item`: renders a single select item. The first `CustomSelectControlV2.Item` child will be used as the `defaultValue` when `defaultValue` is undefined.

#### Props

The component accepts the following props:

##### `children`: `React.ReactNode`

The child elements. This should be composed of `CustomSelectControlV2.Item` components.

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

### `CustomSelectControlV2.Item`

Used to render a select item.

#### Props

The component accepts the following props:

##### `value`: `string`

The value of the select item. This will be used as the children if children are left `undefined`.

-   Required: yes

##### `children`: `React.ReactNode`

The children to display for each select item. The `value` will be used if left `undefined`.

-   Required: no
