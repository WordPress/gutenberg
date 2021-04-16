# hooks

## useResponsiveValue

`useResponsiveValue` is a hook that allows a component to declare a responsive API. For example, if a component wishes to provide the ability to have its `size` prop be responsive, it would delcare the type as follows:

```ts
type Size = 'small' | 'medium' | 'large';

interface Props {
	size: Size | Size[]
}
```

Then the component itself will implement `useResponsiveValue`:

```tsx
function Component( { size: sizeProp, className }: ViewOwnProps< Props, 'div' >, forwardedRef: Ref< any > ) {
	const ref = useRef();

	const size = useResponsiveValue( ref.current, sizeProp );

	const classes = cx(
		className,
		size && styles.sizes[ size ]
	);

	return (
		<div
			className={ classes }
			ref={ mergeRefs( [ forwardedRef, ref ] ) }
		>
			Code is Poetry!
		</div>
	);
}
```

This allows `size` to behave exactly as the "Breakpoint Values" as described by [`create-styles/create-compiler/README.md#breakpoint-values`](../../create-styles/create-compiler/README.md#breakpoint-values).

That is, if a single size is passed in, it will be used. However if size is passed in as an array like so:

```tsx
<Component size={ [ 'medium', 'small', 'large' ] } />
```

Then the size corresponding to the given breakpoint will be used. See [`create-styles/create-compiler/README.md#breakpoint-values`](../../create-styles/create-compiler/README.md#breakpoint-values) for more details and examples.
