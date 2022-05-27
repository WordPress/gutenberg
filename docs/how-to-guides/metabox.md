# Meta Boxes

## Overview

Prior to the block editor, custom meta boxes were used to extend the editor. Now there are new ways to extend, giving more power to the developer and a better experience for the authors. It is recommended to port older custom meta boxes to one of these new methods to create a more unified and consistent experience for those using the editor.

The block editor does support most existing meta boxes, see [the backward compatibility section below](#backward-compatibility) for details .

If you are interested in working with the post meta outside the editor, check out the [Sidebar Tutorial](/docs/how-to-guides/sidebar-tutorial/plugin-sidebar-0.md).

### Use Blocks to Store Meta

Typically, blocks store attribute values in the serialized block HTML. However, you can also create a block that saves its attribute values as post meta, that can be accessed programmatically anywhere in your template.

This guide shows how to create a block that prompts a user for a single value, and saves it to post meta.

## Before you start

This guide assumes you are already familiar with WordPress plugins, post meta, and basic JavaScript. Review the [Getting started with JavaScript tutorial](/docs/how-to-guides/javascript/README.md) for an introduction.

The guide will walk through creating a basic block, but recommended to go through the [Create Block tutorial](/docs/getting-started/create-block/README.md) for a deeper understanding of creating custom blocks.

You will need:

-   WordPress development environment,
-   A minimal plugin activated and ready to edit
-   JavaScript setup for building and enqueuing

A [complete meta-block example](https://github.com/WordPress/gutenberg-examples/tree/trunk/meta-block) is available that you can use as a reference for your setup.

## Step-by-step guide

1. [Register Meta Field](#step-1-register-meta-field)
2. [Add Meta Block](#step-2-add-meta-block)
3. [Use Post Meta Data](#step-3-use-post-meta-data)
4. [Finishing Touches](#step-4-use-block-templates-optional)

### Step 1: Register Meta Field

A post meta field is a WordPress object used to store extra data about a post. You need to first register a new meta field prior to use. See Managing [Post Metadata](https://developer.wordpress.org/plugins/metadata/managing-post-metadata/) to learn more about post meta.

When registering the field, note the `show_in_rest` parameter. This ensures the data will be included in the REST API, which the block editor uses to load and save meta data. See the [`register_post_meta`](https://developer.wordpress.org/reference/functions/register_post_meta/) function definition for extra information.

Additionally, your post type needs to support `custom-fields` for `register_post_meta` function to work

To register the field, add the following to your PHP plugin:

```php
<?php
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

### Step 2: Add Meta Block

With the meta field registered in the previous step, next create a new block to display the field value to the user.

The hook `useEntityProp` can be used by the blocks to get or change meta values.

Add this code to the JavaScript `src/index.js`:

```js
import { registerBlockType } from '@wordpress/blocks';
import { TextControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useEntityProp } from '@wordpress/core-data';
import { useBlockProps } from '@wordpress/block-editor';

registerBlockType( 'myguten/meta-block', {
	edit: ( { setAttributes, attributes } ) => {
		const blockProps = useBlockProps();
		const postType = useSelect(
			( select ) => select( 'core/editor' ).getCurrentPostType(),
			[]
		);

		const [ meta, setMeta ] = useEntityProp( 'postType', postType, 'meta' );

		const metaFieldValue = meta[ 'myguten_meta_block_field' ];
		const updateMetaValue = ( newValue ) => {
			setMeta( { ...meta, myguten_meta_block_field: newValue } );
		};

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

	// No information saved to the block.
	// Data is saved to post meta via the hook.
	save: () => {
		return null;
	},
} );
```

Confirm this works by creating a post and add the Meta Block. You will see your field that you can type a value in. When you save the post, either as a draft or published, the post meta value will be saved too. You can verify by
saving and reloading your draft, the form will still be filled in on reload.

You could also confirm the data is saved by checking the database table `wp_postmeta` and confirm the new post id contains the new field data.

**Troubleshooting**: Be sure to build your code between changes, you updated the PHP code from Step 1, and JavaScript files are enqueued. Check the build output and developer console for errors.

### Step 3: Use Post Meta Data

You can use the post meta data stored in the last step in multiple ways.

#### Use Post Meta in PHP

The first example uses the value from the post meta field and appends it to the end of the post content wrapped in a `H4` tag.

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

You can also use the post meta data in other blocks. For this example the data is loaded at the end of every Paragraph block when it is rendered, ie. shown to the user. You can replace this for any core or custom block types as needed.

In PHP, use the [register_block_type](https://developer.wordpress.org/reference/functions/register_block_type/) function to set a callback when the block is rendered to include the meta value.

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

### Step 4: Use Block Templates (optional)

One problem using a meta block is the block is easy for an author to forget, since it requires being added to each post. You solve this by using [block templates](/docs/reference-guides/block-api/block-templates.md). A block template is a predefined list of block items per post type. Templates allow you to specify a default initial state for a post type.

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

You can also add other block types in the array, including placeholders, or even lock down a post to a set of specific blocks. Templates are a powerful tool for controlling the editing experience, see the documentation linked above for more.

## Conclusion

This guide showed how using blocks you can read and write to post meta. See the section below for backward compatibility with existing meta boxes.

## Backward Compatibility

### Testing, Converting, and Maintaining Existing Meta Boxes

Before converting meta boxes to blocks, it may be easier to test if a meta box works with the block editor, and explicitly mark it as such.

If a meta box _doesn't_ work with the block editor, and updating it to work correctly is not an option, the next step is to add the `__block_editor_compatible_meta_box` argument to the meta box declaration:

```php
add_meta_box( 'my-meta-box', 'My Meta Box', 'my_meta_box_callback',
	null, 'normal', 'high',
	array(
		'__block_editor_compatible_meta_box' => false,
	)
);
```

WordPress won't show the meta box but a message saying that it isn't compatible with the block editor, including a link to the Classic Editor plugin. By default, `__block_editor_compatible_meta_box` is `true`.

After a meta box is converted to a block, it can be declared as existing for backward compatibility:

```php
add_meta_box( 'my-meta-box', 'My Meta Box', 'my_meta_box_callback',
	null, 'normal', 'high',
	array(
		'__back_compat_meta_box' => true,
	)
);
```

When the block editor is used, this meta box will no longer be displayed in the meta box area, as it now only exists for backward compatibility purposes. It will display as before in the classic editor.

### Meta Box Data Collection

On each block editor page load, we register an action that collects the meta box data to determine if an area is empty. The original global state is reset upon collection of meta box data.

See [`register_and_do_post_meta_boxes`](https://developer.wordpress.org/reference/functions/register_and_do_post_meta_boxes/).

It will run through the functions and hooks that `post.php` runs to register meta boxes; namely `add_meta_boxes`, `add_meta_boxes_{$post->post_type}`, and `do_meta_boxes`.

Meta boxes are filtered to strip out any core meta boxes, standard custom taxonomy meta boxes, and any meta boxes that have declared themselves as only existing for backward compatibility purposes.

Then each location for this particular type of meta box is checked for whether it is active. If it is not empty a value of true is stored, if it is empty a value of false is stored. This meta box location data is then dispatched by the editor Redux store in `INITIALIZE_META_BOX_STATE`.

Ideally, this could be done at instantiation of the editor and help simplify this flow. However, it is not possible to know the meta box state before `admin_enqueue_scripts`, where we are calling `initializeEditor()`. This will have to do, unless we want to move `initializeEditor()` to fire in the footer or at some point after `admin_head`. With recent changes to editor bootstrapping this might now be possible. Test with ACF to make sure.

### Redux and React Meta Box Management

When rendering the block editor, the meta boxes are rendered to a hidden div `#metaboxes`.

_The Redux store will hold all meta boxes as inactive by default_. When
`INITIALIZE_META_BOX_STATE` comes in, the store will update any active meta box areas by setting the `isActive` flag to `true`. Once this happens React will check for the new props sent in by Redux on the `MetaBox` component. If that `MetaBox` is now active, instead of rendering null, a `MetaBoxArea` component will be rendered. The `MetaBox` component is the container component that mediates between the `MetaBoxArea` and the Redux Store. _If no meta boxes are active, nothing happens. This will be the default behavior, as all core meta boxes have been stripped._

#### MetaBoxArea Component

When the component renders it will store a reference to the meta boxes container and retrieve the meta boxes HTML from the prefetch location.

When the post is updated, only meta box areas that are active will be submitted. This prevents unnecessary requests. No extra revisions are created by the meta box submissions. A Redux action will trigger on `REQUEST_POST_UPDATE` for any active meta box. See `editor/effects.js`. The `REQUEST_META_BOX_UPDATES` action will set that meta box's state to `isUpdating`. The `isUpdating` prop will be sent into the `MetaBoxArea` and cause a form submission.

When the meta box area is saving, we display an updating overlay, to prevent users from changing the form values while a save is in progress.

An example save url would look like:

`mysite.com/wp-admin/post.php?post=1&action=edit&meta-box-loader=1`

This url is automatically passed into React via a `_wpMetaBoxUrl` global variable.

This page mimics the `post.php` post form, so when it is submitted it will fire all of the normal hooks and actions, and have the proper global state to correctly fire any PHP meta box mumbo jumbo without needing to modify any existing code. On successful submission, React will signal a `handleMetaBoxReload` to remove the updating overlay.

### Common Compatibility Issues

Most PHP meta boxes should continue to work in the block editor, but some meta boxes that include advanced functionality could break. Here are some common reasons why meta boxes might not work as expected in the block editor:

-   Plugins relying on selectors that target the post title, post content fields, and other metaboxes (of the old editor).
-   Plugins relying on TinyMCE's API because there's no longer a single TinyMCE instance to talk to in the block editor.
-   Plugins making updates to their DOM on "submit" or on "save".

Please also note that if your plugin triggers a PHP warning or notice to be output on the page, this will cause the HTML document type (`<!DOCTYPE html>`) to be output incorrectly. This will cause the browser to render using "Quirks Mode", which is a compatibility layer that gets enabled when the browser doesn't know what type of document it is parsing. The block editor is not meant to work in this mode, but it can _appear_ to be working just fine. If you encounter issues such as _meta boxes overlaying the editor_ or other layout issues, please check the raw page source of your document to see that the document type definition is the first thing output on the page. There will also be a warning in the JavaScript console, noting the issue.
