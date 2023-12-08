---
sidebar_position: 5
---

# Nested Blocks

You can create a single block that nests other blocks using the [InnerBlocks](https://github.com/WordPress/gutenberg/tree/HEAD/packages/block-editor/src/components/inner-blocks/README.md) component. This is used in the Columns block, Social Links block, or any block you want to contain other blocks.

**Note:** A single block can only contain one `InnerBlocks` component.

Here is the basic InnerBlocks usage.

```jsx
import { registerBlockType } from '@wordpress/blocks';
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

registerBlockType( 'create-block/gutenpride-container', {
	// ...

	edit: () => {
		const blockProps = useBlockProps();

		return (
			<div { ...blockProps }>
				<InnerBlocks />
			</div>
		);
	},

	save: () => {
		const blockProps = useBlockProps.save();

		return (
			<div { ...blockProps }>
				<InnerBlocks.Content />
			</div>
		);
	},
} );
```

## Allowed Blocks

Using the `allowedBlocks` property, you can define the set of blocks allowed in your InnerBlock. This restricts the blocks that can be included only to those listed, all other blocks will not show in the inserter.

```jsx
const ALLOWED_BLOCKS = [ 'core/heading', 'core/paragraph' ];
//...
<InnerBlocks allowedBlocks={ ALLOWED_BLOCKS } />;
```

## Default Block

By default `InnerBlocks` opens a list of permitted blocks via `allowedBlocks` when the block appender is clicked. You can modify the default block and its attributes that are inserted when the initial block appender is clicked by using the `defaultBlock` property. For example:

```jsx
<InnerBlocks
	defaultBlock={ [ 'core/paragraph', { placeholder: 'Lorem ipsum...' } ] }
	directInsert
/>
```

By default this behavior is disabled until the `directInsert` prop is set to `true`. This allows you to specify conditions for when the default block should or should not be inserted.

## Template

Use the template property to define a set of blocks that prefill the InnerBlocks component when inserted. You can set attributes on the blocks to define their use. The example below shows a book review template using the InnerBlocks component and setting placeholder values to show the block usage.

```js
const MY_TEMPLATE = [
	[ 'core/image', {} ],
	[ 'core/heading', { placeholder: 'Book Title' } ],
	[ 'core/paragraph', { placeholder: 'Summary' } ],
];

//...

	edit: () => {
		return (
			<InnerBlocks
				template={ MY_TEMPLATE }
				templateLock="all"
			/>
		);
	},
```

Use the `templateLock` property to lock down the template. Using `all` locks the template completely so no changes can be made. Using `insert` prevents additional blocks from being inserted, but existing blocks can be reordered. See [templateLock documentation](https://github.com/WordPress/gutenberg/tree/HEAD/packages/block-editor/src/components/inner-blocks/README.md#templatelock) for additional information.

## Using Parent and Ancestor Relationships in Blocks

A common pattern for using InnerBlocks is to create a custom block that will only be available if its parent block is inserted. This allows builders to establish a relationship between blocks while limiting a nested block's discoverability. Currently, there are two relationships builders can use: `parent` and `ancestor`. The differences are:

-   If you assign a `parent` then you’re stating that the nested block can only be used and inserted as a **direct descendant of the parent**.
-   If you assign an `ancestor` then you’re stating that the nested block can only be used and inserted as a **descendent of the parent**.

The key difference between `parent` and `ancestor` is that `parent` has finer specificity, while an `ancestor` has greater flexibility in its nested hierarchy.

### Defining Parent Block Relationship

An example of this is the Column block, which is assigned the `parent` block setting. This allows the Column block to only be available as a nested direct descendant in its parent Columns block. Otherwise, the Column block will not be available as an option within the block inserter. See [Column code for reference](https://github.com/WordPress/gutenberg/tree/HEAD/packages/block-library/src/column).

When defining a direct descendent block, use the `parent` block setting to define which block is the parent. This prevents the nested block from showing in the inserter outside of the InnerBlock it is defined for.

```js
{
	title: 'Column',
	parent: [ 'core/columns' ],
	// ...
}
```

### Defining Ancestor Block Relationship

An example of this is the Comment Author Name block, which is assigned the `ancestor` block setting. This allows the Comment Author Name block to only be available as a nested descendant in its ancestral Comment Template block. Otherwise, the Comment Author Name block will not be available as an option within the block inserter. See [Comment Author Name code for reference](https://github.com/WordPress/gutenberg/tree/HEAD/packages/block-library/src/comment-author-name).

The `ancestor` relationship allows the Comment Author Name block to be anywhere in the hierarchical tree, and not _just_ a direct child of the parent Comment Template block, while still limiting its availability within the block inserter to only be visible an an option to insert if the Comment Template block is available.

When defining a descendent block, use the `ancestor` block setting. This prevents the nested block from showing in the inserter outside of the InnerBlock it is defined for.

```js
{
	title: 'Comment Author Name',
	ancestor: [ 'core/comment-template' ]
	// ...
}
```

## Using a React Hook

You can use a react hook called `useInnerBlocksProps` instead of the `InnerBlocks` component. This hook allows you to take more control over the markup of inner blocks areas.

The `useInnerBlocksProps` is exported from the `@wordpress/block-editor` package same as the `InnerBlocks` component itself and supports everything the component does. It also works like the `useBlockProps` hook.

Here is the basic `useInnerBlocksProps` hook usage.

```jsx
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

registerBlockType( 'create-block/gutenpride-container', {
	// ...

	edit: () => {
		const blockProps = useBlockProps();
		const innerBlocksProps = useInnerBlocksProps();

		return (
			<div { ...blockProps }>
				<div { ...innerBlocksProps } />
			</div>
		);
	},

	save: () => {
		const blockProps = useBlockProps.save();
		const innerBlocksProps = useInnerBlocksProps.save();

		return (
			<div { ...blockProps }>
				<div { ...innerBlocksProps } />
			</div>
		);
	},
} );
```

This hook can also pass objects returned from the `useBlockProps` hook to the `useInnerBlocksProps` hook. This reduces the number of elements we need to create.

```jsx
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

registerBlockType( 'gcreate-block/gutenpride-container', {
	// ...

	edit: () => {
		const blockProps = useBlockProps();
		const innerBlocksProps = useInnerBlocksProps( blockProps );

		return <div { ...innerBlocksProps } />;
	},

	save: () => {
		const blockProps = useBlockProps.save();
		const innerBlocksProps = useInnerBlocksProps.save( blockProps );

		return <div { ...innerBlocksProps } />;
	},
} );
```

The above code will render to the following markup in the editor:

```html
<div>
	<!-- Inner Blocks get inserted here -->
</div>
```

Another benefit of the hook approach is using the returned value, which is just an object, and deconstructing to get the react children from the object. This property contains the actual child inner blocks thus we can place elements on the same level as our inner blocks.

```jsx
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

registerBlockType( 'gutenberg-examples/example-06', {
	// ...

	edit: () => {
		const blockProps = useBlockProps();
		const { children, ...innerBlocksProps } = useInnerBlocksProps( blockProps );

		return (
			<div {...innerBlocksProps}>
    			{ children }
				<!-- Insert any arbitrary html here at the same level as the children -->
			</div>
		);
	},

	// ...
} );
```

```html
<div>
	<!-- Inner Blocks get inserted here -->
	<!-- The custom html gets rendered on the same level -->
</div>
```
