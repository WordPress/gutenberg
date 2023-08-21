# Variations

The Block Variations API  allows you to define multiple versions (variations) of a block. A block variation differs from the original block by a set of initial attributes or inner blocks. When you insert the block variation into the Editor, these attributes and/or inner blocks are applied. 

Variations are an excellent way to create iterations of existing blocks without building entirely new blocks from scratch.

To better understand this API, consider the Embed block. This block contains numerous variations for each type of embeddable content (WordPress, Youtube, etc.). Each Embed block variation shares the same underlying functionality for editing, saving, and so on. Besides the name and descriptive information, the main difference is the `providerNameSlug` attribute. Below is a simplified example of the variations in the Embed block. View the [source code](https://github.com/WordPress/gutenberg/blob/trunk/packages/block-library/src/embed/variations.js) for the complete specification.


```js
variations: [
	{
		name: 'wordpress',
		title: 'WordPress',
		description: __( 'Embed a WordPress post.' ),
		attributes: { providerNameSlug: 'wordpress' },
	},
	{
		name: 'youtube',
		title: 'YouTube',
		description: __( 'Embed a YouTube video.' ),
		attributes: { providerNameSlug: 'youtube' },
	},
],
```

## Defining a block variation

A block variation is defined by an object that can contain the following fields:

-   `name` (type `string`) – A unique and machine-readable name.
-   `title` (optional, type `string`) – A human-readable variation title.
-   `description` (optional, type `string`) – A human-readable variation description.
-   `category` (optional, type `string`) - A category classification used in search interfaces to arrange block types by category.
-   `keywords` (optional, type `string[]`) - An array of terms (which can be translated) that help users discover the variation while searching.
-   `icon` (optional, type `string` | `Object`) – An icon helping to visualize the variation. It can have the same shape as the block type.
-   `attributes` (optional, type `Object`) – Values that override block attributes.
-   `innerBlocks` (optional, type `Array[]`) – Initial configuration of nested blocks.
-   `example` (optional, type `Object`) – Provides structured data for the block preview. Set to `undefined` to disable the preview. See the [Block Registration API](/docs/reference-guides/block-api/block-registration.md#example-optional) for more details.
-   `scope` (optional, type `WPBlockVariationScope[]`) - Defaults to `block` and `inserter`. The list of scopes where the variation is applicable. Available options include:
	- `block` - Used by blocks to filter specific block variations. `Columns` and `Query` blocks have such variations, which are passed to the [experimental BlockVariationPicker](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/block-variation-picker/README.md) component. This component handles displaying the variations and allows users to choose one of them.
    -   `inserter` - Block variation is shown on the inserter.
    -   `transform` - Block variation is shown in the component for variation transformations.
-   `isDefault` (optional, type `boolean`) – Defaults to `false`. Indicates whether the current variation is the default one (details below).
-   `isActive` (optional, type `Function|string[]`) - A function or an array of block attributes that is used to determine if the variation is active when the block is selected. The function accepts `blockAttributes` and `variationAttributes` (details below).

<div class="callout callout-info">
	You can technically create a block variation without a unique <code>name</code>, but this is <strong>not</strong> recommended. A unique <code>name</code> allows the Editor to differentiate between your variation and others that may exist. It also allows your variation to be unregistered as needed and has implications for the <code>isDefault</code> settings (details below).
</div>

## Creating a block variation

Block variations can be declared during a block's registration by providing the `variations` key with a proper array of variation objects, as shown in the example above. See the [Block Registration API](/docs/reference-guides/block-api/block-registration.md) for more details.

To create a variation for an existing block, such as a Core block, use `wp.blocks.registerBlockVariation()`. This function accepts the name of the block and the object defining the variation.

```js
wp.blocks.registerBlockVariation( 
	'core/embed', 
	{
		name: 'custom-embed',
		attributes: { providerNameSlug: 'custom' },
	}
);
```

## Removing a block variation

Block variations can also be easily removed. To do so, use `wp.blocks.unregisterBlockVariation()`. This function accepts the name of the block and the `name` of the variation that should be unregistered. 

```js
wp.blocks.unregisterBlockVariation( 'core/embed', 'youtube' );
```

## Block variations versus block styles

The main difference between block styles and block variations is that a block style just applies a CSS class to the block, so it can be styled in an alternative way. See the [Block Styles API](/docs/reference-guides/block-api/block-styles.md) for more details.

If you want to apply initial attributes or inner blocks, this falls into block variation territory. It's also possible to override the default block style using the `className` attribute when defining a block variation.

```js
variations: [
	{
		name: 'blue',
		title: __( 'Blue Quote' ),
		isDefault: true,
		attributes: { 
			color: 'blue', 
			className: 'is-style-blue-quote' 
		},
		icon: 'format-quote',
		isActive: ( blockAttributes, variationAttributes ) =>
			blockAttributes.color === variationAttributes.color
	},
],
```

## Using `isDefault`

By default, all variations will show up in the Inserter in addition to the original block type item. However, setting the `isDefault` flag for any variations listed will override the regular block type in the Inserter. This is a great tool for curating the Editor experience to your specific needs.

For example, if you want Media & Text block to display the image on the right by default, you could create a variation like this: 

```js
 wp.blocks.registerBlockVariation(
	'core/media-text', 
	{
		name: 'media-text-media-right',
		title: __( 'Media & Text' ),
		isDefault: true,
		attributes: { 
			mediaPosition: 'right'
		}
	}
)
```

### Caveats to using `isDefault`

While `isDefault` works great when overriding a block without existing variations, you may run into issues when other variations exist.

If another variation for the same block uses `isDefault`, your variation will not necessarily become the default. The Editor respects the first registered variation with `isDefault`, which might not be yours.

The solution is to unregister the other variation before registering your variation with `isDefault`. This caveat reinforces the recommendation always to provide variations with a unique `name`. Otherwise, the variation cannot be unregistered.

## Using `isActive`

While the `isActive` property is optional, you will often want to use it to display information about the block variation after the block has been inserted. For example, this API is used in `useBlockDisplayInformation` hook to fetch and display proper information in places like the `BlockCard` or `Breadcrumbs` components.

If `isActive` is not set, the Editor cannot distinguish between the original block and your variation, so the original block information will be displayed. 

The property can use either a function or an array of strings (`string[]`). The function accepts `blockAttributes` and `variationAttributes`, which can be used to determine if a variation is active. In the Embed block, the primary differentiator is the `providerNameSlug` attribute, so if you wanted to determine if the YouTube Embed variation was active, you could do something like this: 

```
isActive: ( blockAttributes, variationAttributes ) =>
	blockAttributes.providerNameSlug === variationAttributes.providerNameSlug,
```

You can also use a `string[]` to tell which attributes should be compared as a shorthand. Each attribute will be checked and the variation will be active if all of them match. Using the same example of the YouTube Embed variation, the string version would look like this:

```
isActive: [ 'providerNameSlug' ]
```

### Caveats to using `isActive`

The `isActive` property can return false positives if multiple variations exist for a specific block and the `isActive` checks are not specific enough. To demonstrate this, consider the following example:

```js
wp.blocks.registerBlockVariation(
	'core/paragraph',
	{
		name: 'paragraph-red',
		title: 'Red Paragraph',
		attributes: {
			textColor: 'vivid-red',
		},
		isActive: [ 'textColor' ],
	}
);

wp.blocks.registerBlockVariation(
	'core/paragraph',
	{
		name: 'paragraph-red-grey',
		title: 'Red/Grey Paragraph',
		attributes: {
			textColor: 'vivid-red',
			backgroundColor: 'cyan-bluish-gray'
		},
		isActive: [ 'textColor', 'backgroundColor' ]
	}
);
```

The `isActive` check on both variations tests the `textColor`, but each variations uses `vivid-red`. Since the `paragraph-red` variation is registered first, once the `paragraph-red-grey` variation is inserted into the Editor, it will have the title `Red Paragraph` instead of `Red/Grey Paragraph`. As soon as the Editor finds a match, it stops checking.

There have been [discussions](https://github.com/WordPress/gutenberg/issues/41303#issuecomment-1526193087) around how the API can be improved, but as of WordPress 6.3, this remains an issue to watch out for.