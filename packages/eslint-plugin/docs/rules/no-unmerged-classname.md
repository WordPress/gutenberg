# Disallow unmerged className in components that spread rest props (no-unmerged-classname)

Ensures that components which spread rest props onto a JSX element also properly forward the incoming `className` prop by merging it into the element's `className` attribute.

When a component sets an explicit `className` on an element that also receives `{...restProps}`, the spread can silently override the explicit value (or vice versa), causing styles to be lost. The correct pattern is to destructure `className` from props and merge it using `clsx` or similar.

This rule is not included in any preset and must be explicitly enabled.

## Rule details

Examples of **incorrect** code for this rule:

```jsx
// className not destructured — it stays in restProps and overrides the explicit value
function Foo( { padding, ...restProps } ) {
	return <div className={ clsx( styles.foo ) } { ...restProps } />;
}
```

```jsx
// Props not destructured — spread of entire props object
function Foo( props ) {
	return <div className={ styles.foo } { ...props } />;
}
```

Examples of **correct** code for this rule:

```jsx
// className destructured and merged
function Foo( { className, ...restProps } ) {
	return <div className={ clsx( styles.foo, className ) } { ...restProps } />;
}
```

```jsx
// No spread on the element — not flagged
function Foo( { ...restProps } ) {
	return <div className={ styles.foo } />;
}
```

```jsx
// className forwarded on a different element than the one with spread — not flagged
function Foo( { className, style, ...props } ) {
	return (
		<Outer className={ clsx( styles.outer, className ) } style={ style }>
			<Inner className={ styles.inner } { ...props } />
		</Outer>
	);
}
```
