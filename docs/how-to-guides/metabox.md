# Meta Boxes

## Overview

Prior to the block editor, custom meta boxes were used to extend the editor. With the new editor there are new ways to
extend, giving more power to the developer and a better experience for the authors. Porting older custom meta boxes to
one of these new methods is encouraged as to create a more unified and consistent experience for those using the editor.

The new block editor does support most existing meta boxes,
see [this backward compatibility article](/docs/reference-guides/backward-compatibility/meta-box.md) for more
support details .

Here are two mini-tutorials for creating similar functionality to meta boxes in the block editor.

## Sidebar Plugin

If you are interested in working with the post meta outside the editor, check out
the [Sidebar Tutorial](/docs/how-to-guides/sidebar-tutorial/plugin-sidebar-0.md).

## Use Blocks to Store Meta

The first method is to use Blocks to store extra data with a post. The data is stored in a post meta field, similar to
how meta boxes store information.

Typically, blocks store their attribute values in the serialised block HTML. However, you can also create a block that
saves its attribute values as post meta, which can be accessed programmatically anywhere in your template.

In this short tutorial you will create one of these blocks, which will prompt a user for a single value, and save it
as post meta.

For background around the thinking of blocks as the interface, please see the
[key concepts section](/docs/explanations/architecture/key-concepts.md) of the handbook.

Before starting this tutorial, you will need a plugin to hold your code. Please take a look at the first two steps
of [the JavaScript tutorial](/docs/how-to-guides/javascript/README.md) for information setting up a plugin.

### Step 1: Register Meta Field

A post meta field is a WordPress object used to store extra data about a post. You need to first register a new meta
field prior to use. See Managing [Post Metadata](https://developer.wordpress.org/plugins/metadata/managing-post-metadata/)
to learn more about post meta.

When registering the field, note the `show_in_rest` parameter. This ensures the data will be included in the REST API,
which the block editor uses to load and save meta data. See
the [`register_post_meta`](https://developer.wordpress.org/reference/functions/register_post_meta/) function definition
for extra information.

Additionally, your post type needs to support `custom-fields` for `register_post_meta` function to work

To register the field, create a PHP plugin file called `myguten-meta-block.php` including:

```php
<?php
/**
 * Plugin Name: Meta Block
 */

// register custom meta tag field
function myguten_register_post_meta() {
	register_post_meta( 'post', 'myguten_meta_block_field', array(
		'show_in_rest' => true,
		'single' => true,
		'type' => 'string',
	) );
}
add_action( 'init', 'myguten_register_post_meta' );
```

**Note:** If the meta key name starts with an underscore WordPress considers it a protected field. Editing this field
requires passing a permission check, which is set as the `auth_callback` in the `register_post_meta` function.
Here is an example:

```php
register_post_meta( 'post', '_myguten_protected_key', array(
	'show_in_rest' => true,
	'single' => true,
	'type' => 'string',
	'auth_callback' => function() {
		return current_user_can( 'edit_posts' );
	}
) );
```

### Step 2: Add Meta Block

With the meta field registered in the previous step, next you will create a new block used to display the field value
to the user. See the [Block Tutorial](/docs/how-to-guides/block-tutorial/README.md) for a deeper understanding of
creating custom blocks.

For this block, you will use the TextControl component, which is similar to an HTML input text field. For additional
components, check out the [Component Reference](/packages/components/README.md).

The hook `useEntityProp` can be used by the blocks to get or change meta values.

Add this code to your JavaScript file (this tutorial will call the file `myguten.js`):

{% codetabs %}
{% ESNext %}

```js
import { registerBlockType } from '@wordpress/blocks';
import { TextControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useEntityProp } from '@wordpress/core-data';
import { useBlockProps } from '@wordpress/block-editor';

registerBlockType( 'myguten/meta-block', {
	title: 'Meta Block',
	icon: 'smiley',
	category: 'text',

	edit( { setAttributes, attributes } ) {
		const blockProps = useBlockProps();
		const postType = useSelect(
			( select ) => select( 'core/editor' ).getCurrentPostType(),
			[]
		);
		const [ meta, setMeta ] = useEntityProp( 'postType', postType, 'meta' );
		const metaFieldValue = meta[ 'myguten_meta_block_field' ];
		function updateMetaValue( newValue ) {
			setMeta( { ...meta, myguten_meta_block_field: newValue } );
		}

		return (
			<div { ...blockProps }>
				<TextControl
					label="Meta Block Field"
					value={ metaFieldValue }
					onChange={ updateMetaValue }
				/>
			</div>
		);
	},

	// No information saved to the block
	// Data is saved to post meta via the hook
	save() {
		return null;
	},
} );
```

{% ES5 %}

```js
( function ( wp ) {
	var el = wp.element.createElement;
	var registerBlockType = wp.blocks.registerBlockType;
	var TextControl = wp.components.TextControl;
	var useSelect = wp.data.useSelect;
	var useEntityProp = wp.coreData.useEntityProp;
	var useBlockProps = wp.blockEditor.useBlockProps;

	registerBlockType( 'myguten/meta-block', {
		title: 'Meta Block',
		icon: 'smiley',
		category: 'text',

		edit: function ( props ) {
			var blockProps = useBlockProps();
			var postType = useSelect( function ( select ) {
				return select( 'core/editor' ).getCurrentPostType();
			}, [] );
			var entityProp = useEntityProp( 'postType', postType, 'meta' );
			var meta = entityProp[ 0 ];
			var setMeta = entityProp[ 1 ];

			var metaFieldValue = meta[ 'myguten_meta_block_field' ];
			function updateMetaValue( newValue ) {
				setMeta(
					Object.assign( {}, meta, {
						myguten_meta_block_field: newValue,
					} )
				);
			}

			return el(
				'div',
				blockProps,
				el( TextControl, {
					label: 'Meta Block Field',
					value: metaFieldValue,
					onChange: updateMetaValue,
				} )
			);
		},

		// No information saved to the block
		// Data is saved to post meta via attributes
		save: function () {
			return null;
		},
	} );
} )( window.wp );
```

{% end %}

**Important:** Before you test, you need to enqueue your JavaScript file and its dependencies. Note the WordPress
packages used above are `wp.element`, `wp.blocks`, `wp.components`, `wp.data`, and `wp.coreData`. Each of these need to
be included in the array of dependencies. Update the `myguten-meta-block.php` file adding the enqueue function:

```php
function myguten_enqueue() {
	wp_enqueue_script(
		'myguten-script',
		plugins_url( 'myguten.js', __FILE__ ),
		array( 'wp-blocks', 'wp-element', 'wp-components', 'wp-data', 'wp-core-data', 'wp-block-editor' )
	);
}
add_action( 'enqueue_block_editor_assets', 'myguten_enqueue' );
```

You can now edit a draft post and add a Meta Block to the post. You will see your field that you can type a value in.
When you save the post, either as a draft or published, the post meta value will be saved too. You can verify by
saving and reloading your draft, the form will still be filled in on reload.

![Meta Block](https://raw.githubusercontent.com/WordPress/gutenberg/HEAD/docs/assets/meta-block.png)

You can now use the post meta data in a template, or another block. See next section for
[using post meta data](#step-3-use-post-meta-data). You could also confirm the data is saved
by checking the database table `wp_postmeta` and confirm the new post id contains the new field data.

### Step 3: Use Post Meta Data

You can use the post meta data stored in the last step in multiple ways.

#### Use Post Meta in PHP

The first example uses the value from the post meta field and appends it to the end of the post content wrapped in a `H4`
tag. This method in PHP is unchanged in WordPress 5.0.

```php
function myguten_content_filter( $content ) {
	$value = get_post_meta( get_the_ID(), 'myguten_meta_block_field', true );
	if ( $value ) {
		return sprintf( "%s <h4> %s </h4>", $content, esc_html( $value ) );
	} else {
		return $content;
	}
}
add_filter( 'the_content', 'myguten_content_filter' );
```

#### Use Post Meta in Block

You can also use the post meta data in other blocks. For this example the data is loaded at the end of every Paragraph
block when it is rendered, ie. shown to the user. You can replace this for any core or custom block types as needed.

In PHP, use the [register_block_type](https://developer.wordpress.org/reference/functions/register_block_type/) function
to set a callback when the block is rendered to include the meta value.

```php
function myguten_render_paragraph( $block_attributes, $content ) {
	$value = get_post_meta( get_the_ID(), 'myguten_meta_block_field', true );
	// check value is set before outputting
	if ( $value ) {
		return sprintf( "%s (%s)", $content, esc_html( $value ) );
	} else {
		return $content;
	}
}

register_block_type( 'core/paragraph', array(
	'api_version' => 2,
	'render_callback' => 'myguten_render_paragraph',
) );
```

### Step 4: Finishing Touches

One problem using a meta block is the block is easy for an author to forget, since it requires being added to each post.
You solve this by using [block templates](/docs/reference-guides/block-api/block-templates.md). A block template is a
predefined list of block items per post type. Templates allow you to specify a default initial state for a post type.

For this example, you use a template to automatically insert the meta block at the top of a post.

Add the following code to the `myguten-meta-block.php` file:

```php
function myguten_register_template() {
    $post_type_object = get_post_type_object( 'post' );
    $post_type_object->template = array(
        array( 'myguten/meta-block' ),
    );
}
add_action( 'init', 'myguten_register_template' );
```

You can also add other block types in the array, including placeholders, or even lock down a post to a set of specific
blocks. Templates are a powerful tool for controlling the editing experience, see the documentation linked above for more.
