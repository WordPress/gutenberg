# Creating dynamic blocks

It is possible to create dynamic blocks. These are blocks that can change their content even if the post is not saved. One example from WordPress itself is the latest posts block. This block will update everywhere it is used when a new post is published.

The following code example shows how to create the latest post block dynamic block.

{% codetabs %}
{% ES5 %}
```js
// myblock.js

var el = wp.element.createElement,
	registerBlockType = wp.blocks.registerBlockType,
	withSelect = wp.data.withSelect;

registerBlockType( 'my-plugin/latest-post', {
	title: 'Latest Post',
	icon: 'megaphone',
	category: 'widgets',

	edit: withSelect( function( select ) {
		return {
			posts: select( 'core' ).getEntityRecords( 'postType', 'post' )
		};
	} )( function( props ) {
		if ( props.posts && props.posts.length === 0 ) {
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

	save: function() {
		// Rendering in PHP
		return null;
	},
} );
```
{% ESNext %}
```js
// myblock.js

const { registerBlockType } = wp.blocks;
const { withSelect } = wp.data;

registerBlockType( 'my-plugin/latest-post', {
	title: 'Latest Post',
	icon: 'megaphone',
	category: 'widgets',

	edit: withSelect( ( select ) => {
		return {
			posts: select( 'core' ).getEntityRecords( 'postType', 'post' )
		};
	} )( ( { posts, className } ) => {
		if ( posts && posts.length === 0 ) {
			return "No posts";
		}
		var post = posts[ 0 ];

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

Because it is a dynamic block it also needs a server component. The rendering can be added using the `render_callback` property when using the `register_block_type` function.

```php
<?php
// block.php

function my_plugin_render_block_latest_post( $attributes, $content ) {
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

* The edit function still shows a representation of the block in the editor's context (this could be very different from the rendered version, it's up to the block's author)
* The save function just returns null because the rendering is performed server-side.
* The server-side rendering is a function taking the block attributes and the block inner content as arguments, and returning the markup (quite similar to shortcodes)

## Live rendering in Gutenberg editor

Gutenberg 2.8 added the [`<ServerSideRender>`](https://github.com/WordPress/gutenberg/tree/master/packages/components/src/server-side-render) block which enables all the rendering to take place on the server using PHP rather than in JavaScript. Server-side render is meant as a fallback; client-side rendering in JavaScript is the preferred implementation.

{% codetabs %}
{% ES5 %}
```js
// myblock.js

var el = wp.element.createElement,
	registerBlockType = wp.blocks.registerBlockType,
	ServerSideRender = wp.components.ServerSideRender;

registerBlockType( 'my-plugin/latest-post', {
	title: 'Latest Post',
	icon: 'megaphone',
	category: 'widgets',

	edit: function( props ) {
		// ensure the block attributes matches this plugin's name
		return (
			el(ServerSideRender, {
				block: "my-plugin/latest-post",
				attributes:  props.attributes
			})
		);
	},

	save: function() {
		// Rendering in PHP
		return null;
	},
} );
```
{% ESNext %}
```js
// myblock.js

const { registerBlockType } = wp.blocks;
const { ServerSideRender } = wp.components;

registerBlockType( 'my-plugin/latest-post', {
	title: 'Latest Post',
	icon: 'megaphone',
	category: 'widgets',

	edit: function( props ) {
		// ensure the block attributes matches this plugin's name
		return (
			<ServerSideRender
				block="my-plugin/latest-post"
				attributes={ props.attributes }
			/>
		);
	},

	save() {
		// Rendering in PHP
		return null;
	},
} );
```
{% end %}

The PHP code is the same as above and is automatically handled through the WP REST API.

## Rendering block markup with PHP

Dynamic blocks can be used in order to control the markup of your block with PHP. This is useful as if you decide to change your blocks markup, you won't have to go back and re-save all the posts which use that block, in order for your blocks markup change to be reflected on all posts.

{% ESNext %}
```js
// grab the translation stuff.
const { __ } = wp.i18n;

// grab the register block type component.
const { registerBlockType } = wp.blocks;

// grab the richtext editor component.
const { RichText } = wp.editor;

// register our block type.
registerBlockType(
    'my-block-namespace/my-block',
    {
        title: __( 'My Dynamic Block', 'my-block-namespace'),
        description: __( 'A simple richtext field in a dynamic block.', 'my-block-namespace'),
        icon: 'megaphone',        
        category: 'widgets',
        // setup our attributes - just 1 richtext field named message.
        // no need to declare selector or source as we are using php to render the block.
        attributes: {
            message: {
                type: 'array',
            },
        },
        edit: props => {
            const { attributes: { message }, className, setAttributes } = props;
            const onChangeMessage = message => { setAttributes( { message } ) };
            return (
                <div className={ className }>
                    <RichText
                        tagName="div"
                        multiline="p" // when you press enter in the editor, it will create a new paragraph.
                        placeholder={ __( 'Add your custom message', 'my-block-namespace' ) }
                        onChange={ onChangeMessage }
                        value={ message }
                    />
                </div>
            );
        },
        save( { attributes } ) {
            return (
                <RichText.Content
                    value={ attributes.message }
                />
            );
        },
} );
```
In the example above, the block attributes (in this case the message rich text field) get passed to the save function. As we are going to use PHP to render the front-end, we don't provide any markup here but we simply return the content of the rich text field using `RichText.Content`, the value of which is the value of the `message` entered into the editor (`attributes.message`).

Then to use PHP to output this on the front-end we need to register the block type in PHP like so and define a callback.

```php
<?php
/**
 * Register the dynamic block.
 *
 * Registers our block on the server side and defines its render callback.
 * The render callback is the function used to output this on the front-end.
 *
 * @since 2.1.0
 *
 * @return void
 */
function my_register_dynamic_block() {

	// Only load if Gutenberg is available.
	if ( ! function_exists( 'register_block_type' ) ) {
		return;
	}

	// Hook server side rendering into render callback
	register_block_type(
		'my-block-namespace/my-block',
		array(
			'render_callback' => 'my_render_dynamic_block',
		)
	);

}

add_action( 'plugins_loaded', 'my_register_dynamic_block', 10, 2 );

/**
 * Server rendering for our dynamic rich text block.
 *
 * @param  array $attributes An array of block attributes.
 * @param  string $content    The is the contents of the message field from the editor as a string.
 * @return string             The HTML to output for our block including the content from the editor.
 */
function my_render_dynamic_block( $attributes, $content ) {

	// we can now return the rich text fields content with whatever markup we like.
	return '<div class="my-richtext-block">' . $content . '</div>';

}
```
