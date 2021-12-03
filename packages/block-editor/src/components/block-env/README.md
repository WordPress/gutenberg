# Block Context

Block Context is a React implementation of WordPress's block context. Block context, much like [React's context](https://reactjs.org/docs/context.html), is a method for passing and inheriting values deeply through a hierarchy of blocks. Because of the similarities with React's context, the client-side implementation here is quite minimal. It is complemented by equivalent behaviors in the server-side rendering of a block.

Note that the implementation of Block Context is distinct from [the `BlockEdit` context](../block-edit). While it is true that both provide context relevant for the editing of a block, Block Context is implemented separately so as to prioritize it as most identifiable amongst the machinery of block context, and not amongst other client-side editing context of a block.

## Usage

Currently, only the [Provider component](https://reactjs.org/docs/context.html#contextprovider) is made available on the public interface of the `@wordpress/block-editor` module. This can be used to add or override context which can then be consumed by blocks rendered within that context in the block editor.

```js
import { BlockContextProvider } from '@wordpress/block-editor';

function MyCustomPostEditor() {
	return (
		<BlockContextProvider value={ { postId: 1, postType: 'post' } }>
			<BlockEditorProvider { /* ... */ } />
		</BlockContextProvider>
	);
}
```

Internal to the `@wordpress/block-editor` module, a component can access the [full Context object](https://reactjs.org/docs/context.html#api), typically for use in combination with [`useContext`](https://reactjs.org/docs/hooks-reference.html#usecontext).

```js
import { useContext } from '@wordpress/element';

// Only available internally within `@wordpress/block-editor`!
import BlockContext from '../block-context';

function MyBlockComponent() {
	const { postId } = useContext( BlockContext );

	return 'The current post ID is: ' + postId;
}
```

The reason `BlockContext` is only internally available within the `@wordpress/block-editor` module is to reinforce the expectation that external consumption of values from block context should be declared on the block registration using the `context` property.

## Props

`BlockContextProvider` behaves like a standard [`Context.Provider` component](https://reactjs.org/docs/context.html#contextprovider). It receives `value` and `children` props. The `value` is merged with the current block context value.

### `value`

-   Type: `Record<string,*>`
-   Required: Yes

Context value to merge with current value.

### `children`

-   Type: `ReactNode`
-   Required: Yes

Component children.
