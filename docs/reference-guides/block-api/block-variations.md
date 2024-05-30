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

While the `isActive` property is optional, it's recommended. This API is used by the block editor to check which variation is active, and display the correct variation's title, icon and description when an instance of the variation is selected in the editor.

If `isActive` is not set, the Editor cannot distinguish between an instance of the original block and your variation, so the original block information will be displayed.

The property can be set to either an array of strings (`string[]`), or a function. It is recommended to use the string array version whenever possible.

The `string[]` version is used to declare which of the block instance's attributes should be compared to the given variation's. Each attribute will be checked and the variation will be active if all of them match.

As an example, in the core Embed block, the `providerNameSlug` attribute is used to determine the embed provider (e.g. 'youtube' or 'twitter'). The variations may be declared like this:

```js
const variations = [
	{
		name: 'twitter',
		title: 'Twitter',
		icon: embedTwitterIcon,
		keywords: [ 'tweet', __( 'social' ) ],
		description: __( 'Embed a tweet.' ),
		patterns: [ /^https?:\/\/(www\.)?twitter\.com\/.+/i ],
		attributes: { providerNameSlug: 'twitter', responsive: true },
	},
	{
		name: 'youtube',
		title: 'YouTube',
		icon: embedYouTubeIcon,
		keywords: [ __( 'music' ), __( 'video' ) ],
		description: __( 'Embed a YouTube video.' ),
		patterns: [
			/^https?:\/\/((m|www)\.)?youtube\.com\/.+/i,
			/^https?:\/\/youtu\.be\/.+/i,
		],
		attributes: { providerNameSlug: 'youtube', responsive: true },
	},
	// ...
]
```

The `isActive` property would then look like this:

```js
isActive: [ 'providerNameSlug' ]
```

This will cause the block instance value for `providerNameSlug` to be compared to the value declared in the variation's declaration (the values in the code snippet above) to determine which embed variation is active.

Nested object paths are also supported. For example, consider a block variation that has a `query` object as an attribute. It is possible to determine if the variation is active solely based on that object's `postType` property (while ignoring all its other properties):

```js
isActive: [ 'query.postType' ]
```

The function version of this property accepts a block instance's `blockAttributes` as the first argument, and the `variationAttributes` declared for a variation as the second argument. These arguments can be used to determine if a variation is active by comparing them and returning a `true` or `false` (indicating whether this variation is inactive for this block instance).

Using the same example for the embed block, the function version would look like this:

```js
isActive: ( blockAttributes, variationAttributes ) =>
	blockAttributes.providerNameSlug === variationAttributes.providerNameSlug,
```

### Specificity of `isActive` matches

If there are multiple variations whose `isActive` check matches a given block instance, and all of them are string arrays, then the variation with the highest _specificity_ will be chosen. Consider the following example:

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

If a block instance has attributes `textColor: vivid-red` and `backgroundColor: cyan-bluish-gray`, both variations' `isActive` criterion will match that block instance. In this case, the more _specific_ match will be determined to be the active variation, where specificity is calculated as the length of each `isActive` array. This means that the `Red/Grey Paragraph` will be shown as the active variation.

Note that specificity cannot be determined for a matching variation if its `isActive` property is a function rather than a `string[]`. In this case, the first matching variation will be determined to be the active variation. For this reason, it is generally recommended to use a `string[]` rather than a `function` for the `isActive` property.
