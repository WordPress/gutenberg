# Creating dynamic blocks

Dynamic blocks are blocks that can change their content even if the post is not saved. One example from WordPress itself is the latest posts block. This block will update everywhere it is used when a new post is published.

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

## Live rendering in Gutenberg editor

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
