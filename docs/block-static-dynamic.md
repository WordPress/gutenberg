# Static & Dynamic Blocks

Blocks can have two distinct characteristics when they are created. Static blocks are those that don't require the server to compute the final output as it is already saved as semantic HTML and can be directly displayed. The vast majority of basic blocks used to compose a post are of this nature (examples: paragraph, image, quote, video).

Dynamic blocks, on the contrary, require the server to generate the output. They might not save any HTML at all, relying on the pure marker supplied by the comment syntax (`<!-- wp:myblock -->`) and its encoded attributes. These blocks are the direct evolution of shortcodes and widgets. An example of a dynamic block would be the "latest posts" block, which generates a list of recent posts at the time of rendering. When such a block doesn't save any HTML, it becomes invisible in contexts where the server cannot compute an output (this is a major difference with shortcodes that appear as text debris under some conditions).

It is worth noting that a dynamic block can still choose to have static content as a fallback. For example, one might choose to render a link to the blog section of the site if the latest posts cannot be generated. This link would show in RSS, emails, etc, whenever the block cannot be processed dynamically.

## Example

The following code example shows how to create the latest post block dynamic block. Usually a dynamic block is going to return `null` on the `save` function.

{% codetabs %}
{% ES5 %}
```js
// myblock.js

var el = wp.element.createElement,
	registerBlockType = wp.blocks.registerBlockType,
	withAPIData = wp.components.withAPIData;

registerBlockType( 'my-plugin/latest-post', {
	title: 'Latest Post',
	icon: 'megaphone',
	category: 'widgets',

	edit: withAPIData( function() {
		return {
			posts: '/wp/v2/posts?per_page=1'
		};
	} )( function( props ) {
		if ( ! props.posts.data ) {
			return "loading !";
		}
		if ( props.posts.data.length === 0 ) {
			return "No posts";
		}
		var className = props.className;
		var post = props.posts.data[ 0 ];

		return el(
			'a',
			{ className: className, href: post.link },
			post.title.rendered
		);
	} ),

	save: function() {
		// Rendering in PHP
		return null;
	},
} );
```
{% ESNext %}
```js
// myblock.js

const { el } = wp.element;
const { registerBlockType } = wp.blocks;
const { withAPIData } = wp.components;

registerBlockType( 'my-plugin/latest-post', {
	title: 'Latest Post',
	icon: 'megaphone',
	category: 'widgets',

	edit: withAPIData( () => {
		return {
			posts: '/wp/v2/posts?per_page=1'
		};
	} )( ( { posts, className } ) => {
		if ( ! posts.data ) {
			return "loading !";
		}
		if ( posts.data.length === 0 ) {
			return "No posts";
		}
		var post = posts.data[ 0 ];

		return <a className={ className } href={ post.link }>
			{ post.title.rendered }
		</a>;
	} ),

	save() {
		// Rendering in PHP
		return null;
	},
} );
```
{% end %}

On the server, the rendering can be added using the `render_callback` property when using the `register_block_type` function.

```php
<?php
// block.php

function my_plugin_render_block_latest_post( $attributes ) {
	$recent_posts = wp_get_recent_posts( array(
		'numberposts' => 1,
		'post_status' => 'publish',
	) );
	if ( count( $recent_posts ) === 0 ) {
		return 'No posts';
	}
	$post = $recent_posts[ 0 ];
	$post_id = $post['ID'];
	return sprintf(
		'<a class="wp-block-my-plugin-latest-post" href="%1$s">%2$s</a>',
		esc_url( get_permalink( $post_id ) ),
		esc_html( get_the_title( $post_id ) )
	);
}

register_block_type( 'my-plugin/latest-post', array(
	'render_callback' => 'my_plugin_render_block_latest_post',
) );
```

There are a few things to notice:

* The edit function still shows a representation of the block in the editor's context (this could be very different from the rendered version, it's up to the block's author and the desired user experience).
* The save function just returns `null` because the rendering is performed server-side.
* The server-side rendering is a function taking the block attributes as an argument and returning the markup (similar to shortcodes).
