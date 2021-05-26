# BaseField

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

`BaseField` is an internal (i.e., not exported in the `index.js`) primitive component used for building more complex fields like `TextField`. It provides error handling and focus styles for field components. It does _not_ handle layout of the component aside from wrapping the field in a `Flex` wrapper.

## Usage

`BaseField` is primarily used as a hook rather than a component:

```js
function useExampleField( props ) {
	const { 
		as = 'input',
		...baseProps,
	} = useBaseField( props );

	const inputProps = {
		as,
		// more cool stuff here
	}

	return { inputProps, ...baseProps };
}

function ExampleField( props, forwardRef ) {
	const {
		preFix,
		affix,
		disabled,
		inputProps,
		...baseProps
	} = useExampleField( props );

	return (
		<View { ...baseProps } disabled={ disabled }>
			{preFix}
			<View
				autocomplete="off"
				{ ...inputProps }
				disabled={ disabled }
			/>
			{affix}
		</View>
	);
}
```

## Props

### `error`: `boolean`

Renders an error style around the component.

### `disabled`: `boolean`

Whether the field is disabled.

### `isClickable`: `boolean`

Renders a `cursor: pointer` on hover;

### `isFocused`: `boolean`

Renders focus styles around the component.

### `isInline`: `boolean`

Renders a component that can be inlined in some text.

### `isSubtle`: `boolean`

Renders a subtle variant of the component.
