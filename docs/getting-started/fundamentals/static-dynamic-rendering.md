# Static or Dynamic rendering of a block

A block's front-end markup can either be dynamically generated server-side upon request (dynamic blocks) or statically generated during the save process in the Block Editor (static blocks). This article explores each method.

<div class="callout callout-tip">
The post <a href="https://developer.wordpress.org/news/2023/02/27/static-vs-dynamic-blocks-whats-the-difference/">Static vs. dynamic blocks: What’s the difference?</a> provides a great introduction to this topic.
</div>

## Static rendering

Blocks with "static rendering" produce front-end output that is fixed and stored in the database upon saving. These blocks rely solely on their `save` function to define their [HTML markup](https://developer.wordpress.org/block-editor/getting-started/fundamentals/markup-representation-block/), which remains unchanged unless manually edited in the Block Editor.

If a block does not use a dynamic rendering method—meaning it doesn't generate content on the fly via PHP when the page loads—it's considered a "static block."

The diagram below illustrates how static block content is saved in the database and then retrieved and rendered as HTML on the front end.

![Blocks with static rendering diagram](https://developer.wordpress.org/files/2024/01/static-rendering.png)

### How to define static rendering for a block

The `save` function, which can be defined when [registering a block on the client](https://developer.wordpress.org/block-editor/getting-started/fundamentals/registration-of-a-block/#registration-of-the-block-with-javascript-client-side), specifies the block's HTML structure that gets saved in the database whenever you save the block in the Editor. This saved HTML is then used to display the block on the front end.

Blocks in WordPress are encapsulated within special comment tags that serve as unique [block delimiters](https://developer.wordpress.org/block-editor/getting-started/fundamentals/markup-representation-block/). However, only the HTML defined in the static block's `save` function—excluding these delimiters—is rendered.

<details><summary><strong>View an example of static rendering in the Preformatted block</strong></summary>
<br/>
The following <a href="https://github.com/WordPress/gutenberg/blob/trunk/packages/block-library/src/preformatted/save.js"><code>save</code> function</a> for the <a href="https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/preformatted">Preformatted</a> core block looks like this:

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

The function generates the following markup representation of the block when `attributes.content` has the value `"This is some preformatted text"`:

```html
<!-- wp:preformatted -->
<pre class="wp-block-preformatted">This is some preformatted text</pre>
<!-- /wp:preformatted -->
```

On the front end, the block will return the following markup. Notice how the delimiters are no longer present.

```html
<pre class="wp-block-preformatted">This is some preformatted text</pre>
```
</details>
<br/>

Dynamic blocks, which we'll explore in the following section, can specify an initial HTML structure through a `save` function, similar to static blocks. However, dynamic blocks primarily rely on server-side rendering to generate their content. If, for any reason, the dynamic rendering isn't available—perhaps due to the block's plugin being deactivated—the system will fall back to using the HTML structure saved in the database to display the block on the front end.

For a practical demonstration of how this works, refer to the [Building your first block](/docs/getting-started/tutorial.md) tutorial. Specifically, the [Adding static rendering](/docs/getting-started/tutorial.md#adding-static-rendering) section illustrates how a block can have both a saved HTML structure and dynamic rendering capabilities.

<div class="callout callout-info">
WordPress provides mechanisms like the <a href="https://developer.wordpress.org/reference/functions/render_block/"><code>render_block</code></a> and the <a href="https://developer.wordpress.org/block-editor/how-to-guides/block-tutorial/creating-dynamic-blocks/"><code>render_callback</code></a> function to alter the saved HTML of a block before it appears on the front end. These tools offer developers the capability to customize block output dynamically, catering to complex and interactive user experiences.
</div>

Additional examples of WordPress blocks that use static rendering, meaning their output is fixed at the time of saving and doesn't rely on server-side processing, include:

- [Separator](https://github.com/WordPress/gutenberg/blob/trunk/packages/block-library/src/separator/save.js)
- [Spacer](https://github.com/WordPress/gutenberg/blob/trunk/packages/block-library/src/spacer/save.js)
- [Button](https://github.com/WordPress/gutenberg/blob/trunk/packages/block-library/src/button/save.js)


## Dynamic rendering

Blocks with "dynamic rendering" are designed to generate their content and structure in real-time when requested on the front end. Unlike static blocks, which have a fixed HTML structure saved in the database, "dynamic blocks" rely on server-side processing to construct their output dynamically, making them highly versatile and suitable for content that needs to be updated frequently or is dependent on external data.

The diagram below illustrates how the representation of a dynamic block is saved in the database and then retrieved and dynamically rendered as HTML on the front end.

![Blocks with dynamic rendering diagram](https://developer.wordpress.org/files/2024/01/dynamic-rendering.png)

There are some common use cases for dynamic blocks:

1. **Blocks where content should change even if a post has not been updated:** An example is the [Latest Posts](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/latest-posts) block, which will automatically update whenever a new post is published.
2. **Blocks where updates to the markup should be immediately shown on the front end:** If you update the structure of a block by adding a new class, adding an HTML element, or changing the layout in any other way, using a dynamic block ensures those changes are applied immediately on all occurrences of that block across the site. Without dynamic blocks, similar updates could trigger [validation errors](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#validation) in the Block Editor.

### How to define dynamic rendering for a block

A block can define dynamic rendering in two main ways:

1. Using the `render_callback` argument that can be passed to the [`register_block_type()`](https://developer.wordpress.org/block-editor/getting-started/fundamentals/registration-of-a-block/#registration-of-the-block-with-php-server-side) function.
2. Using a separate PHP file usually named `render.php`. This file's path should be defined using the [`render`](https://developer.wordpress.org/block-editor/getting-started/fundamentals/block-json/#files-for-the-blocks-behavior-output-or-style) property in the `block.json` file.

Both of these methods receive the following data:

 - `$attributes`: The array of attributes for the block.
 - `$content`: The markup of the block as stored in the database, if any.
 - `$block`: The instance of the [WP_Block](https://developer.wordpress.org/reference/classes/wp_block/) class that represents the rendered block ([metadata of the block](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/)).

<details><summary><strong>View an example of dynamic rendering in the Site Title block</strong></summary>
<br/>

The [Site Title](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/site-title) block uses the following [`render_callback`](https://github.com/WordPress/gutenberg/blob/trunk/packages/block-library/src/site-title/index.php):

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

However, there is no `save` function defined for this block, as you can see from its [`index.js`](https://github.com/WordPress/gutenberg/blob/trunk/packages/block-library/src/site-title/index.js) file, which means the markup representation of the block in the database looks like this:

```html
<!-- wp:site-title /-->
```

On the front end, the `render_callback` is used to dynamically render the markup for the block depending on the specific values on the server at the time the block is requested. These values include the current site title, URL, link target, etc.

```
<h1 class="wp-block-site-title"><a href="https://www.wp.org" target="_self" rel="home">My WordPress Website</a></h1>
```

</details>
<br/>

### HTML representation of dynamic blocks in the database (`save`)

For dynamic blocks, the `save` callback function can return just `null`, which tells the editor to save only the block delimiter comment (along with any existing [block attributes](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-attributes/)) to the database. These attributes are then passed into the server-side rendering callback, which will determine how to display the block on the front end of your site.

When `save` is `null`, the Block Editor will skip the [block markup validation process](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#validation), avoiding issues with frequently changing markup.

Blocks with dynamic rendering can also save an HTML representation of the block as a backup. If you provide a server-side rendering callback, the HTML representing the block in the database will be replaced with the output of your callback but will be rendered if your block is deactivated (the plugin that registers the block is uninstalled), or your render callback is removed.

In some cases, the block saves an HTML representation of the block and uses a dynamic rendering to fine-tune this markup if some conditions are met. Some examples of core blocks using this approach are:

- The [Cover](https://github.com/WordPress/gutenberg/blob/trunk/packages/block-library/src/cover) block [saves](https://github.com/WordPress/gutenberg/blob/trunk/packages/block-library/src/cover/save.js) a full HTML representation of the block in the database. This markup is processed via a [`render_callback`](https://github.com/WordPress/gutenberg/blob/22741661998834e69db74ad863705ee2ce97b446/packages/block-library/src/cover/index.php#L74), which [dynamically injects](https://github.com/WordPress/gutenberg/blob/22741661998834e69db74ad863705ee2ce97b446/packages/block-library/src/cover/index.php#L16) the featured image if the "Use featured image" setting is enabled.
- The [Image](https://github.com/WordPress/gutenberg/blob/trunk/packages/block-library/src/image) block also [saves](https://github.com/WordPress/gutenberg/blob/trunk/packages/block-library/src/image/save.js) its HTML representation in the database. This markup is processed via a [`render_callback`](https://github.com/WordPress/gutenberg/blob/22741661998834e69db74ad863705ee2ce97b446/packages/block-library/src/image/index.php#L363), which [adds additional attributes](https://github.com/WordPress/gutenberg/blob/22741661998834e69db74ad863705ee2ce97b446/packages/block-library/src/image/index.php#L18) to the markup if specific conditions are met.

If you are using [InnerBlocks](https://developer.wordpress.org/block-editor/how-to-guides/block-tutorial/nested-blocks-inner-blocks/) in a dynamic block, you will need to save the `InnerBlocks` in the `save` callback function using `<InnerBlocks.Content/>`.

## Additional resources

- [Static vs. dynamic blocks: What’s the difference?](https://developer.wordpress.org/news/2023/02/27/static-vs-dynamic-blocks-whats-the-difference/) | Developer Blog
- [Block deprecation – a tutorial](https://developer.wordpress.org/news/2023/03/10/block-deprecation-a-tutorial/) | Developer Blog
