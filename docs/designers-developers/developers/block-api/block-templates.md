# Templates

A block template is defined as a list of block items. Such blocks can have predefined attributes, placeholder content, and be static or dynamic. Block templates allow to specify a default initial state for an editor session.

The scope of templates include:

- Setting a default state dynamically on the client. (like `defaultBlock`)
- Registered as a default for a given post type.

Planned additions:

- Saved and assigned to pages as "page templates".
- Defined in a `template.php` file or pulled from a custom post type (`wp_templates`) that is site specific.
- As the equivalent of the theme hierarchy.

## API

Templates can be declared in JS or in PHP as an array of blockTypes, which consist of a block name and optional attributes.

**PHP Example**  
The following example in PHP creates a template for posts that includes an image block and a paragraph to start. For the paragraph in this example, the placeholder is defined as 'Image Details'. 
You can add as many or as few blocks to your template as needed.

```php
<?php
function myplugin_register_template() {
    $post_type_object = get_post_type_object( 'post' );
    $post_type_object->template = array(
        array( 'core/image' ),
	    array( 
		    'core/paragraph', 
		    array( 
			    'placeholder' => 'Image Details' ),
		    )
    );
}
add_action( 'init', 'myplugin_register_template' );
```
The optional attributes that can be set vary per block type. For a quick overview of the attributes of core block type, you can often check the block type's accompanying block.json file. For example, [these lines](https://github.com/WordPress/gutenberg/blob/master/packages/block-library/src/audio/block.json#L4-L37) describe the attributes of the `core/audio` block.

**JS example:**  
The following example in JavaScript creates a new custom block using [InnerBlocks](/packages/block-editor/src/components/inner-blocks/README.md) and templates. When this block is inserted, this block creates a set of blocks based off the template.


```js
const el = wp.element.createElement;
const { registerBlockType } = wp.blocks;
const { InnerBlocks } = wp.editor;

const BLOCKS_TEMPLATE = [
	[ 'core/image', {} ],
	[ 'core/paragraph', { placeholder: 'Image Details' } ],
];

registerBlockType( 'myplugin/template', {
	title: 'My Template Block',
	category: 'widgets',
	edit: ( props ) => {
		return el( InnerBlocks, {
			template: BLOCKS_TEMPLATE,
			templateLock: false
		});
	},
	save: ( props ) => {
		return el( InnerBlocks.Content, {} );
	},
});
```

Templates are especially useful in combination with blocks that store custom post_meta to a post type. See the [Meta Block Tutorial](/docs/designers-developers/developers/tutorials/metabox/meta-block-5-finishing.md).
for more information. 

## Custom Post types

A custom post type can register its own template during registration:

```php
function myplugin_register_book_post_type() {
	$args = array(
		'public' => true,
		'label'  => 'Books',
		'show_in_rest' => true,
		'template' => array(
			array( 'core/image', array(
				'align' => 'left',
			) ),
			array( 'core/heading', array(
				'placeholder' => 'Add Author...',
			) ),
			array( 'core/paragraph', array(
				'placeholder' => 'Add Description...',
			) ),
		),
	);
	register_post_type( 'book', $args );
}
add_action( 'init', 'myplugin_register_book_post_type' );
```

### Locking

Sometimes the intention might be to lock the template on the UI so that the blocks presented cannot be manipulated. This is achieved with a `template_lock` property.

```php
function myplugin_register_template() {
	$post_type_object = get_post_type_object( 'post' );
	$post_type_object->template = array(
		array( 'core/paragraph', array(
			'placeholder' => 'Add Description...',
		) ),
	);
	$post_type_object->template_lock = 'all';
}
add_action( 'init', 'myplugin_register_template' );
```

*Options:*

- `all` — prevents all operations. It is not possible to insert new blocks, move existing blocks, or delete blocks.
- `insert` — prevents inserting or removing blocks, but allows moving existing blocks.

## Nested Templates

Container blocks like the columns block also support templates. This makes it possible to define which block types are used by default in each column, by adding a nested template to the block type array like so:
```php
$template = array(
	array( 'core/paragraph', array(
		'placeholder' => 'Add a root-level paragraph',
	) ),
	array( 'core/columns', array(), array(
		array( 'core/column', array(), array(
			array( 'core/image', array() ),
		) ),
		array( 'core/column', array(), array(
			array( 'core/paragraph', array(
				'placeholder' => 'Add a inner paragraph'
			) ),
		) ),
	) )
);
```