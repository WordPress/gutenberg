# Variations

Block Variations is the API that allows a block to have similar versions of it, but all these versions share some common functionality. Each block variation is differentiated from the others by setting some initial attributes or inner blocks. Then at the time when a block is inserted these attributes and/or inner blocks are applied.

A great way to understand this API better is by using the `embed` block as an example. The numerous existing variations for embed (WordPress, Youtube, etc..) share the same functionality for editing, saving, and so on, but their basic difference is the `providerNameSlug` attribute's value, which defines the provider that needs to be used.

By default, all variations will show up in the Inserter in addition to the regular block type item. However, setting the `isDefault` flag for any of the variations listed will override the regular block type in the Inserter.

```js
variations: [
    {
		name: 'wordpress',
		isDefault: true,
		title: __( 'WordPress' ),
		description: __( 'Code is poetry!' ),
		icon: WordPressIcon,
		attributes: { providerNameSlug: 'wordpress' },
	},
	{
		name: 'google',
		title: __( 'Google' ),
		icon: GoogleIcon,
		attributes: { providerNameSlug: 'google' },
	},
	{
		name: 'twitter',
		title: __( 'Twitter' ),
		icon: TwitterIcon,
		attributes: { providerNameSlug: 'twitter' },
		keywords: [ __('tweet') ],
	},
],
```

An object describing a variation defined for the block type can contain the following fields:

-   `name` (type `string`) – The unique and machine-readable name.
-   `title` (type `string`) – A human-readable variation title.
-   `description` (optional, type `string`) – A detailed variation description.
-   `category` (optional, type `string`) - A category classification, used in search interfaces to arrange block types by category.
-   `icon` (optional, type `string` | `Object`) – An icon helping to visualize the variation. It can have the same shape as the block type.
-   `isDefault` (optional, type `boolean`) – Indicates whether the current variation is the default one. Defaults to `false`.
-   `attributes` (optional, type `Object`) – Values that override block attributes.
-   `innerBlocks` (optional, type `Array[]`) – Initial configuration of nested blocks.
-   `example` (optional, type `Object`) – Example provides structured data for the block preview. You can set to `undefined` to disable the preview shown for the block type.
-   `scope` (optional, type `WPBlockVariationScope[]`) - the list of scopes where the variation is applicable. When not provided, it defaults to `block` and `inserter`. Available options:
    -   `inserter` - Block Variation is shown on the inserter.
    -   `block` - Used by blocks to filter specific block variations. `Columns` and `Query Loop` blocks have such variations and are passed to the [experimental BlockVariationPicker](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/block-variation-picker/README.md) component, which is handling the displaying of variations and the ability to select one from them.
    -   `transform` - Block Variation will be shown in the component for Block Variations transformations.
-   `keywords` (optional, type `string[]`) - An array of terms (which can be translated) that help users discover the variation while searching.
-   `isActive` (optional, type `Function|string[]`) - This can be a function or an array of block attributes. Function that accepts a block's attributes and the variation's attributes and determines if a variation is active. This function doesn't try to find a match dynamically based on all block's attributes, as in many cases some attributes are irrelevant. An example would be for `embed` block where we only care about `providerNameSlug` attribute's value. We can also use a `string[]` to tell which attributes should be compared as a shorthand. Each attributes will be matched and the variation will be active if all of them are matching.

The main difference between block styles and block variations is that a block style just applies a CSS class to the block, so it can be styled in an alternative way. If we want to apply initial attributes or inner blocks, we fall in block variation territory.

It's also possible to override the default block style using the `className` attribute when defining block variations.

```js
variations: [
	{
		name: 'blue',
		title: __( 'Blue Quote' ),
		isDefault: true,
		attributes: { color: 'blue', className: 'is-style-blue-quote' },
		icon: 'format-quote',
		isActive: ( blockAttributes, variationAttributes ) =>
			blockAttributes.color === variationAttributes.color
	},
],
```

It's worth mentioning that setting the `isActive` property can be useful for cases you want to use information from the block variation, after a block's creation. For example, this API is used in `useBlockDisplayInformation` hook to fetch and display proper information on places like the `BlockCard` or `Breadcrumbs` components.

Block variations can be declared during a block's registration by providing the `variations` key with a proper array of variations, as defined above. In addition, there are ways to register and unregister a `block variation` for a block, after its registration.

To add a block variation use `wp.blocks.registerBlockVariation()`.

_Example:_

```js
wp.blocks.registerBlockVariation( 'core/embed', {
	name: 'custom',
	attributes: { providerNameSlug: 'custom' },
} );
```

To remove a block variation use `wp.blocks.unregisterBlockVariation()`.

_Example:_

```js
wp.blocks.unregisterBlockVariation( 'core/embed', 'youtube' );
```
