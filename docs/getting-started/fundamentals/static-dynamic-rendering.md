# Static or Dynamic rendering of a block

The block's markup returned on the front end can be dynamically generated on the server when the block is requested from the client (dynamic blocks) or statically generated when the block is saved in the Block Editor (static blocks).

<div class="callout callout-tip">
The post <a href="https://developer.wordpress.org/news/2023/02/27/static-vs-dynamic-blocks-whats-the-difference/">Static vs. dynamic blocks: What’s the difference?</a> provides a great introduction to static and dynamic blocks.
</div>

## Static rendering 

![Blocks with static rendering diagram](https://developer.wordpress.org/files/2024/01/static-rendering.png)

Blocks are considered "static" when they have "static rendering", this is when their output for the front end is statically generated when saved to the database, as returned by their `save` functions.

Blocks have static rendering **when no dynamic rendering method has been defined (or is available) for the block**. In this case, the output for the front end will be taken from the [markup representation of the block in the database](https://developer.wordpress.org/block-editor/getting-started/fundamentals/markup-representation-block/) that is returned by its `save` function when the block is saved in the Block Editor. This type is block is often called a "static block".

### How to define static rendering for a block

The `save` function, which can be defined when [registering a block on the client](https://developer.wordpress.org/block-editor/getting-started/fundamentals/registration-of-a-block/#registration-of-the-block-with-javascript-client-side), determines the markup of the block that will be stored in the database when the content is saved and eventually returned to the front end when there's a request. This markup is stored wrapped up in [unique block delimiters](https://developer.wordpress.org/block-editor/getting-started/fundamentals/markup-representation-block/) but only the markup inside these block indicators is returned as the markup to be rendered for the block on the front end.

To define static rendering for a block we define a `save` function for the block without any dynamic rendering method.

<details><summary><em>Example of static rendering of the <code>preformatted</code> core block</em></summary>
<br/>
For example, the following <a href="https://github.com/WordPress/gutenberg/blob/trunk/packages/block-library/src/preformatted/save.js"><code>save</code> function</a> of the <a hreh="https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/preformatted"><code>preformatted</code></a> core block...

```js
import { RichText, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { content } = attributes;

	return (
		<pre { ...useBlockProps.save() }>
			<RichText.Content value={ content } />
		</pre>
	);
}
```

...generates the following markup representation of the block when `attributes.content` has the value `"This is some preformatted text"`...

```html
<!-- wp:preformatted -->
<pre class="wp-block-preformatted">This is some preformatted text</pre>
<!-- /wp:preformatted -->
```

...and it will return the following markup for the block to the front end when there's a request.

```html
<pre class="wp-block-preformatted">This is some preformatted text</pre>
```

</details>

<br/>

Blocks with dynamic rendering can also define a markup representation of the block (via the `save` function) which can be processed in the server before returning the markup to the front end. If no dynamic rendering method is found, any markup representation of the block in the database will be returned to the front end.

<div class="callout callout-info">
The markup stored for a block can be modified before it gets rendered on the front end via hooks such as <a href="https://developer.wordpress.org/reference/functions/render_block/"><code>render_block</code></a> or via <code>$render_callback</code>.
</div>

Some examples of core blocks with static rendering are:

- [`separator`](https://github.com/WordPress/gutenberg/blob/trunk/packages/block-library/src/separator) (see its [`save`](https://github.com/WordPress/gutenberg/blob/trunk/packages/block-library/src/separator/save.js) function) 
- [`spacer`](https://github.com/WordPress/gutenberg/blob/trunk/packages/block-library/src/spacer) (see its [`save`](https://github.com/WordPress/gutenberg/blob/trunk/packages/block-library/src/spacer/save.js) function).
- [`button`](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/button) (see its [`save`](https://github.com/WordPress/gutenberg/blob/trunk/packages/block-library/src/button/save.js) function).


## Dynamic rendering

Blocks with dynamic rendering are blocks that **build their structure and content on the fly when the block is requested from the client**. This type of block is often called a "dynamic block".

![Blocks with dynamic rendering diagram](https://developer.wordpress.org/files/2024/01/dynamic-rendering.png)

There are some common use cases for dynamic blocks:

1. **Blocks where content should change even if a post has not been updated**. An example is the [`latest-posts` core block](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/latest-posts), which will update its content on request time, everywhere it is used after a new post is published.
2. **Blocks where updates to the markup should be immediately shown on the front end of the website**. For example, if you update the structure of a block by adding a new class, adding an HTML element, or changing the layout in any other way, using a dynamic block ensures those changes are applied immediately on all occurrences of that block across the site. If a dynamic block is not used then when block code is updated, Gutenberg's [validation process](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#validation) generally applies, causing users to see the validation message: "This block appears to have been modified externally".

### How to define dynamic rendering for a block

A block can define dynamic rendering in two main ways:

1. Via the `render_callback` argument that can be passed to the [`register_block_type()` function](https://developer.wordpress.org/block-editor/getting-started/fundamentals/registration-of-a-block/#registration-of-the-block-with-php-server-side).
2. Via a separate PHP file (usually named `render.php`) which path can be defined at the [`render` property of the `block.json`](https://developer.wordpress.org/block-editor/getting-started/fundamentals/block-json/#files-for-the-blocks-behavior-output-or-style).

Both of these ways to define the block's dynamic rendering receive the following data:

 - `$attributes` - The array of attributes for this block.
 - `$content` - Rendered block output (markup of the block as stored in the database).
 - `$block` - The instance of the [WP_Block](https://developer.wordpress.org/reference/classes/wp_block/) class that represents the block being rendered ([metadata of the block](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/)).

<details><summary><em>Example of dynamic rendering of the <code>site-title</code> core block</em></summary>
<br/>

For example, the [`site-title`](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/site-title) core block with the following function registered as [`render_callback`](https://github.com/WordPress/gutenberg/blob/trunk/packages/block-library/src/site-title/index.php)...

```php
function render_block_core_site_title( $attributes ) {
	$site_title = get_bloginfo( 'name' );
	if ( ! $site_title ) {
		return;
	}

	$tag_name = 'h1';
	$classes  = empty( $attributes['textAlign'] ) ? '' : "has-text-align-{$attributes['textAlign']}";
	if ( isset( $attributes['style']['elements']['link']['color']['text'] ) ) {
		$classes .= ' has-link-color';
	}

	if ( isset( $attributes['level'] ) ) {
		$tag_name = 0 === $attributes['level'] ? 'p' : 'h' . (int) $attributes['level'];
	}

	if ( $attributes['isLink'] ) {
		$aria_current = is_home() || ( is_front_page() && 'page' === get_option( 'show_on_front' ) ) ? ' aria-current="page"' : '';
		$link_target  = ! empty( $attributes['linkTarget'] ) ? $attributes['linkTarget'] : '_self';

		$site_title = sprintf(
			'<a href="%1$s" target="%2$s" rel="home"%3$s>%4$s</a>',
			esc_url( home_url() ),
			esc_attr( $link_target ),
			$aria_current,
			esc_html( $site_title )
		);
	}
	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => trim( $classes ) ) );

	return sprintf(
		'<%1$s %2$s>%3$s</%1$s>',
		$tag_name,
		$wrapper_attributes,
		// already pre-escaped if it is a link.
		$attributes['isLink'] ? $site_title : esc_html( $site_title )
	);
}
```

... generates the following markup representation of the block in the database (as [there's no `save` function defined for this block](https://github.com/WordPress/gutenberg/blob/trunk/packages/block-library/src/site-title/index.js))...

```html
<!-- wp:site-title /-->
```

...and it could generate the following markup for the block to the front end when there's a request (depending on the specific values on the server at request time).

```
<h1 class="wp-block-site-title"><a href="https://www.wp.org" target="_self" rel="home">My WordPress Website</a></h1>
```

</details>
<br/>

### HTML representation of dynamic blocks in the database (`save`)

For dynamic blocks, the `save` callback function can return just `null`, which tells the editor to save only the block delimiter comment (along with any existing [block attributes](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-attributes/)) to the database. These attributes are then passed into the server-side rendering callback, which will determine how to display the block on the front end of your site. **When `save` is `null`, the Block Editor will skip the [block markup validation process](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#validation)**, avoiding issues with frequently changing markup.

Blocks with dynamic rendering can also save an HTML representation of the block as a backup. If you provide a server-side rendering callback, the HTML representing the block in the database will be replaced with the output of your callback, but will be rendered if your block is deactivated (the plugin that registers the block is uninstalled) or your render callback is removed.

In some cases, the block saves an HTML representation of the block and uses a dynamic rendering to fine-tune this markup if some conditions are met. Some examples of core blocks using this approach are:

- The [`cover`](https://github.com/WordPress/gutenberg/blob/trunk/packages/block-library/src/cover) block saves a [full HTML representation of the block in the database](https://github.com/WordPress/gutenberg/blob/trunk/packages/block-library/src/cover/save.js). This markup is processed via a [`render_callback`](https://github.com/WordPress/gutenberg/blob/22741661998834e69db74ad863705ee2ce97b446/packages/block-library/src/cover/index.php#L74) when requested to do some PHP magic that dynamically [injects the featured image if the "use featured image" setting is enabled](https://github.com/WordPress/gutenberg/blob/22741661998834e69db74ad863705ee2ce97b446/packages/block-library/src/cover/index.php#L16).
- The [`image`](https://github.com/WordPress/gutenberg/blob/trunk/packages/block-library/src/image) block also saves [its HTML representation in the database](https://github.com/WordPress/gutenberg/blob/trunk/packages/block-library/src/image/save.js) and processes it via a [`render_callback`](https://github.com/WordPress/gutenberg/blob/22741661998834e69db74ad863705ee2ce97b446/packages/block-library/src/image/index.php#L363) when requested to [add some attributes to the markup](https://github.com/WordPress/gutenberg/blob/22741661998834e69db74ad863705ee2ce97b446/packages/block-library/src/image/index.php#L18) if some conditions are met.

If you are using [InnerBlocks](https://developer.wordpress.org/block-editor/how-to-guides/block-tutorial/nested-blocks-inner-blocks/) in a dynamic block, you will need to save the `InnerBlocks` in the `save` callback function using `<InnerBlocks.Content/>`.

## Additional Resources

- [Static vs. dynamic blocks: What’s the difference?](https://developer.wordpress.org/news/2023/02/27/static-vs-dynamic-blocks-whats-the-difference/)
- [Block deprecation – a tutorial](https://developer.wordpress.org/news/2023/03/10/block-deprecation-a-tutorial/)