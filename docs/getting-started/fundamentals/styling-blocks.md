# Styling blocks

A block's appearance comes from two places: the CSS you ship with the block, and the CSS WordPress generates from the settings a user chooses in the Editor. Most blocks use both. This guide covers the mechanisms available for each, and when to reach for which.

As a rule of thumb, prefer the mechanisms that let WordPress generate the CSS. [Block supports](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/) and [`theme.json`](https://developer.wordpress.org/block-editor/reference-guides/theme-json-reference/) give users controls in the Editor and produce styles that respect the active theme's presets. Write your own stylesheet for the structural CSS that makes the block work, the parts a user shouldn't have to configure.

All of the classes and inline styles described below are added to the block's wrapper element, so the block must apply the props returned by `useBlockProps()` and `useBlockProps.save()` for any of it to take effect. See [The block wrapper](https://developer.wordpress.org/block-editor/getting-started/fundamentals/block-wrapper/) for details.

## Stylesheets shipped with a block

A block declares its stylesheets in [`block.json`](https://developer.wordpress.org/block-editor/getting-started/fundamentals/block-json/), and WordPress enqueues them only on pages where the block is present:

-   **[`style`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#style):** enqueued both in the Editor and on the front end. Use it for the block's shared appearance.
-   **[`editorStyle`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#editor-style):** enqueued only in the Editor. Use it for editing affordances, such as styles for placeholder states.
-   **[`viewStyle`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#view-style):** enqueued only on the front end.

Each property accepts a [file path](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#wpdefinedpath) prefixed with `file:`, the handle of a style registered with `wp_register_style()`, or an array combining both.

```json
{
	"$schema": "https://schemas.wp.org/trunk/block.json",
	"apiVersion": 3,
	"name": "example/my-block",
	"style": "file:./style-index.css",
	"editorStyle": "file:./index.css"
}
```

## Class names generated for a block

WordPress adds class names to the block wrapper that your stylesheet can target:

-   `wp-block-{namespace}-{name}` identifies the block type. `example/my-block` becomes `wp-block-example-my-block`. Core blocks drop the `core` namespace, so `core/quote` becomes `wp-block-quote`.
-   `is-style-{name}` is added when a [block style variation](#block-style-variations) other than the default is selected.
-   `align{value}` is added when the user picks an alignment, for blocks that opt into the `align` support, for example `alignwide` and `alignfull`.
-   `has-{slug}-color`, `has-{slug}-background-color`, `has-text-color`, and `has-background` are added when colors are chosen from the theme's palette through the `color` block support.

Because the block type class is unique to the block, it is usually specific enough on its own:

```css
.wp-block-example-my-block {
	display: grid;
	gap: var( --wp--preset--spacing--30 );
}
```

Presets defined by the theme are available as CSS custom properties following the pattern `--wp--preset--{preset}--{slug}`, such as `--wp--preset--color--accent` or `--wp--preset--font-size--large`. Using them, rather than hard-coded values, keeps the block in step with whatever theme it lands in.

## Block supports

The [Block Supports API](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/) is the shortest path to giving users control over a block's appearance. Opting into a support adds the corresponding controls to the block's sidebar and takes care of serializing the user's choices as classes and inline styles on the wrapper, with no styling code on your part.

```json
{
	"supports": {
		"align": [ "wide", "full" ],
		"color": {
			"background": true,
			"text": true,
			"gradients": true
		},
		"spacing": {
			"padding": true,
			"margin": true
		},
		"typography": {
			"fontSize": true,
			"lineHeight": true
		}
	}
}
```

Some supports also handle layout. When a block opts into the `layout` support with a `constrained` type, WordPress generates the rules that constrain content width and let `alignwide` and `alignfull` children escape it, using the theme's `contentSize` and `wideSize` values. Blocks should rely on that generated CSS instead of writing their own `.alignwide` or `.alignfull` rules.

## Block style variations

Block styles offer users a set of named alternatives for a block, selectable from the block toolbar or the sidebar. They are declared with the `styles` property in `block.json`, and selecting one adds an `is-style-{name}` class to the wrapper. The Quote block, for example, ships two:

```json
{
	"styles": [
		{ "name": "default", "label": "Default", "isDefault": true },
		{ "name": "plain", "label": "Plain" }
	]
}
```

The style marked with `isDefault` is the one considered active when no `is-style-` class is present, so no class is output for it. The remaining styles are yours to define in the block's stylesheet:

```css
.wp-block-quote.is-style-plain {
	border-width: 0;
	font-style: normal;
}
```

Styles can also be registered for blocks you do not own, including core blocks, using `register_block_style()` in PHP or `registerBlockStyle()` in JavaScript. See the [Styles reference](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-styles/) for both, and for supplying the CSS alongside the registration.

## theme.json

[`theme.json`](https://developer.wordpress.org/block-editor/reference-guides/theme-json-reference/) sets defaults for a block, per site, under `styles.blocks`. Its values are merged in three layers: WordPress defaults, then the theme's `theme.json`, then the user's choices in the Editor. Anything a user sets in the Editor wins, which is what makes this the right place for defaults rather than for styles that must hold.

```json
{
	"$schema": "https://schemas.wp.org/trunk/theme.json",
	"version": 3,
	"styles": {
		"blocks": {
			"example/my-block": {
				"color": {
					"background": "var:preset|color|base",
					"text": "var:preset|color|contrast"
				},
				"spacing": {
					"padding": "2rem"
				}
			}
		}
	}
}
```

`theme.json` is a theme-level file, so this applies when the block is styled by a theme. A plugin that registers a block declares the same kind of defaults through the `attributes` and `supports` in its own `block.json`.

## Styles driven by block attributes

When a block needs a style that no existing support covers, store the value in an attribute and pass it to `useBlockProps()`, which merges it with the classes and inline styles WordPress contributes rather than replacing them:

```js
import { useBlockProps } from '@wordpress/block-editor';

export default function Edit( { attributes } ) {
	const { overlayOpacity } = attributes;
	const blockProps = useBlockProps( {
		style: { '--example-overlay-opacity': overlayOpacity },
	} );

	return <div { ...blockProps }>{ /* Block content */ }</div>;
}
```

The `save` function needs the matching call so the same markup is stored in the database:

```js
import { useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { overlayOpacity } = attributes;
	const blockProps = useBlockProps.save( {
		style: { '--example-overlay-opacity': overlayOpacity },
	} );

	return <div { ...blockProps }>{ /* Block content */ }</div>;
}
```

Setting a custom property, as above, keeps the value in one place and leaves the rest of the styling in your stylesheet. For dynamic blocks, the server-side equivalent is [`get_block_wrapper_attributes()`](https://developer.wordpress.org/reference/functions/get_block_wrapper_attributes/), which accepts the same kind of extra attributes.

## Additional resources

-   [Block supports](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/) | Block Editor Handbook
-   [Styles](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-styles/) | Block Editor Handbook
-   [Global Settings and Styles (theme.json)](https://developer.wordpress.org/block-editor/reference-guides/theme-json-reference/) | Block Editor Handbook
-   [Use styles and stylesheets](https://developer.wordpress.org/block-editor/how-to-guides/block-tutorial/applying-styles-with-stylesheets/) | Block Editor Handbook
-   [CSS Coding Standards](https://developer.wordpress.org/coding-standards/wordpress-coding-standards/css/) | WordPress Coding Standards
