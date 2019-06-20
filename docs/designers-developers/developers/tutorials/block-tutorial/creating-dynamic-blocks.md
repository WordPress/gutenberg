# Creating dynamic blocks

Dynamic blocks are blocks that build their structure and content on the fly when the block is rendered on the front end.

There are two primary uses for dynamic blocks:
1. Blocks where content should change even if a post has not been updated. One example from WordPress itself is the latest posts block. This block will update everywhere it is used when a new post is published.
2. Blocks where updates to the code (HTML, CSS, JS) should be immediately shown on the front end of the website. For example, if you update the HTML structure of a block by adding a new class, adding a div, or changing the layout in any other way, if you want these changes to be applied immediately on all occurrences of that block across the site, a dynamic block should be used. (If a dynamic block is not used then when block code is updated Guterberg's [validation process](https://developer.wordpress.org/block-editor/developers/block-api/block-edit-save/#validation) applies, causing users to see the validation message, "This block appears to have been modified externally").

The general principle of dynamic blocks is that the built in `save` function should be returned as `null` so that Guternberg does not save the block HTML into the database. Instead Gutenberg will save only the [block attributes](https://developer.wordpress.org/block-editor/developers/block-api/block-attributes/) when the page is updated.  These attributes are then available to be used by the server-side rendering for displaying the block on the front end of your site.  (Alternatively, the return value of `save` could represent a cached copy of the block’s content to be shown only in case the plugin implementing the block is ever disabled.)

Block attributes can be used for any content or setting you want to save for that block. In the first example above, with the latest posts block, the number of latest posts you want to show could be saved as an attribute. Or in the second example, attributes can be used for each piece of content you want to show in the front end - such as heading text, paragraph text, an image, a URL, etc.


The following code example shows how to create a dynamic block that shows only the last post as a link.

{% codetabs %}
{% ES5 %}
```js
( function( blocks, element, data ) {

	var el = element.createElement,
	registerBlockType = blocks.registerBlockType,
	withSelect = data.withSelect;

	registerBlockType( 'gutenberg-examples/example-05-dynamic', {
		title: 'Example: last post',
		icon: 'megaphone',
		category: 'widgets',
		
		edit: withSelect( function( select ) {
			return {
				posts: select( 'core' ).getEntityRecords( 'postType', 'post' )
			};
		} )( function( props ) {

			if ( ! props.posts ) {
				return "Loading...";
			}

			if ( props.posts.length === 0 ) {
				return "No posts";
			}
			var className = props.className;
			var post = props.posts[ 0 ];

			return el(
				'a',
				{ className: className, href: post.link },
				post.title.rendered
			);
		} ),
	} );
}(
	window.wp.blocks,
	window.wp.element,
	window.wp.data,
) );
```
{% ESNext %}
```js
const { registerBlockType } = wp.blocks;
const { withSelect } = wp.data;

registerBlockType( 'gutenberg-examples/example-05-dynamic', {
	title: 'Example: last post',
	icon: 'megaphone',
	category: 'widgets',

	edit: withSelect( ( select ) => {
		return {
			posts: select( 'core' ).getEntityRecords( 'postType', 'post' )
		};
	} )( ( { posts, className } ) => {

		if ( ! posts ) {
			return "Loading...";
		}

		if ( posts && posts.length === 0 ) {
			return "No posts";
		}

		let post = posts[ 0 ];

		return <a className={ className } href={ post.link }>
			{ post.title.rendered }
		</a>;
	} ),
} );
```
{% end %}

Because it is a dynamic block it doesn't need to override the default `save` implementation on the client. Instead, it needs a server component. The contents in the front of your site depend on the function called by the `render_callback` property of `register_block_type`.

```php
<?php

/*
Plugin Name: Gutenberg examples 05
*/

function gutenberg_examples_05_dynamic_render_callback( $attributes, $content ) {
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

function gutenberg_examples_05_dynamic() {
	wp_register_script(
		'gutenberg-examples-05',
		plugins_url( 'block.js', __FILE__ ),
		array( 'wp-blocks', 'wp-element', 'wp-data' )
	);

	register_block_type( 'gutenberg-examples/example-05-dynamic', array(
		'editor_script' => 'gutenberg-examples-05',
		'render_callback' => 'gutenberg_examples_05_dynamic_render_callback'
	) );

}
add_action( 'init', 'gutenberg_examples_05_dynamic' );

```

There are a few things to notice:

* The `edit` function still shows a representation of the block in the editor's context (this could be very different from the rendered version, it's up to the block's author)
* The built-in `save` function just returns `null` because the rendering is performed server-side.
* The server-side rendering is a function taking the block attributes and the block inner content as arguments, and returning the markup (quite similar to shortcodes)

## Live rendering in the block editor

Gutenberg 2.8 added the [`<ServerSideRender>`](/packages/components/src/server-side-render) block which enables rendering to take place on the server using PHP rather than in JavaScript. 

*Server-side render is meant as a fallback; client-side rendering in JavaScript is always preferred (client rendering is faster and allows better editor manipulation).*

{% codetabs %}
{% ES5 %}
```js
( function( blocks, element, components ) {

	var el = element.createElement,
	registerBlockType = blocks.registerBlockType,
	ServerSideRender = components.ServerSideRender;

	registerBlockType( 'gutenberg-examples/example-05-dynamic', {
		title: 'Example: last post',
		icon: 'megaphone',
		category: 'widgets',

		edit: function( props ) {

			return (
				el(ServerSideRender, {
					block: "gutenberg-examples/example-05-dynamic",
					attributes: props.attributes
				} )
			);
		},
	} );
}(
	window.wp.blocks,
	window.wp.element,
	window.wp.components,
) );
```
{% ESNext %}
```js
const { registerBlockType } = wp.blocks;
const { ServerSideRender } = wp.components;

registerBlockType( 'gutenberg-examples/example-05-dynamic', {
	title: 'Example: last post',
	icon: 'megaphone',
	category: 'widgets',

	edit: function( props ) {
		return (
			<ServerSideRender
				block="gutenberg-examples/example-05-dynamic"
				attributes={ props.attributes }
			/>
		);
	},
} );
```
{% end %}

Note that this code uses the `wp.components` utility but not `wp.data`. Make sure to update the `wp-data` dependency to `wp-compononents` in the PHP code.
