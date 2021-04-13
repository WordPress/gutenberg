# create-style-system

This module creates the `styled` utility as well as the overall style system.

## styled

`styled` works just as Emotion's and `styled-components`'s `styled` function objects. It is able to accept a component as an argument to style as well as is a collection of "core elements" that can be used to create styled elements on the fly.

For example:

```js
const Text = styled.span`
	color: blue;
`;
```

`Text` is a React component that will render a `span` with the custom styles applied.

`styled` can also be used as a function to apply custom styles to existing components:

```jsx
const Component = ( { className } ) => {
	return <div className={ className }>My Favorite Component</div>;
};

const StyledComponent = styled( Component )`
	color: green;
`;
```

For a component to be able to be passed to `styled`, the only requirement is that it forward the `className` prop.

Ultimately `styled` is just an interface for `css` that automatically applies the generated class name from the CSS to a given component, whether that is one of the core elements or a passed in component. That is why passed in components must forward the `className` prop.

`styled` also supports component interpolation. See [`css`'s documentation here](../create-compiler/README.md) for more information on how it works. A breif example is here:

```js
const Text = styled.span`
	color: red;
`;

const Container = styled.div`
	display: flex;

	${ Text } {
		color: blue;
	}
`;
```

Now any child component `Text` of `Container` will be targeted with the `color: blue` style, while `Text` itself will continue to render the `color: red` style.

## Polymorphic Component

This module also exposes the concept of the Polymorphic Component. This concept is not new to this style system but the style and component system use it extensively and it is one of the more powerful aspects of this style system.

Poylmorphic components are able to accept an `as` prop that will accept any React component or JSX Element name. For example:

```jsx
<View as="span" />
```

Will render everything `View` renders but as a `span`.

This is even more powerful when combining elements:

```jsx
<VStack as="form">
	<HStack as={ Button } variant="primary">
		<View as="span" css={ { color: 'red' } }>
			Click me!
		</View>
	</HStack>
</VStack>
```

As you can see, the component polymorphism allows you to powerfully compose the component system with itself and with other component systems. Even passing `as={ ReakitComponent }` for example will work, enabling powerful accessibility patterns while still maintaining the power of the style system on the core `View` component.

Component polymorphism is documented via the `PolymorphicComponent` type in `polymorphic-component.ts`.

The same module also exposes a `ViewOwnProps` type which gives the `as` props to a regular `Props` interface:

```tsx
interface Props {
	foo: string;
}

function MyButton( props: ViewOwnProps< Props, 'button' > ) {
	return <View as="button" { ...props } />;
}
```

The second parameter to `ViewOwnProps` should indicate the _default_ `as` value for the component. That is, if the component renders a `button` as the example above does, it should be `button`. This will give the `props` type all of the appropriate `HTMLAttributes` for the given intrinsic element. For example, our `MyButton` component above is able to accept a strongly typed `onClick` for a `MouseEvent<HTMLButtonElement>`. Likewise, this will automagically change if `as` is passed as a different value:

```jsx
<MyButton as="a" href="https://wordpress.org">
	Code is Poetry
</MyButton>
```

`href` will be strongly typed to the `HTMLAnchorAttributes` prop.
