---
sidebar_position: 3
---

# Block Supports

A lot of blocks, including core blocks, offer similar customization options. Whether that is to change the background color, text color, or to add padding, margin customization options.

To avoid duplicating the same logic over and over in your blocks and to align the behavior of your block with core blocks, Gutenberg provides a list of reusable block supports.

Let's augment our Gutenberg pride block with some of these supports. To do so, we just update the `registerBlockType` call with an additional `supports` key like so:

```jsx
registerBlockType( 'create-block/gutenpride', {
	// ...
	supports: {
		color: {
			text: true,
			background: true,
		},
	},
} );
```

If your block editor allows text and background colors, the block inspector will now show a panel that allows users to customize these colors for the selected block.

In addition to colors, the block editor provides by default a number of built-in block supports that any block type can use to quickly add customization options. These block supports include:

 - colors
 - typography
 - borders
 - dimensions and spacing
 - and more...
