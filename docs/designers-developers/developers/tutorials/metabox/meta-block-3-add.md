# Create Meta Block

With the meta field registered in the previous step, next you will create a new block used to display the field value to the user. See the [Block Tutorial](/docs/designers-developers/developers/tutorials/block-tutorial/readme.md) for a deeper understanding of creating custom blocks.

For this block, you will use the TextControl component, which is similar to an HTML input text field. For additional components, check out the [components](/packages/components/src) and [editor](/packages/editor/src/components) packages repositories.

Attributes are the information displayed in blocks. As shown in the block tutorial, the source of attributes come from the text or HTML a user writes in the editor. For your meta block, the attribute will come from the post meta field.

By specifying the source of the attributes as `meta`, the Block Editor automatically handles the loading and storing of the data; no REST API or data functions are needed.

Add this code to your JavaScript file (this tutorial will call the file `myguten.js`):

```js
( function( wp ) {
	var el = wp.element.createElement;
	var registerBlockType = wp.blocks.registerBlockType;
	var TextField = wp.components.TextControl;

	registerBlockType("myguten/meta-block", {
		title: "Meta Block",
		icon: "smiley",
		category: "common",

		attributes: {
			blockValue: {
				type: "string",
				source: "meta",
				meta: "myguten_meta_block_field"
			}
		},

		edit: function(props) {
			var className = props.className;
			var setAttributes = props.setAttributes;

			function updateBlockValue( blockValue ) {
				setAttributes({ blockValue });
			}

		return el(
				"div",
				{ className: className },
				el( TextField, {
					label: "Meta Block Field",
					value: props.attributes.blockValue,
					onChange: updateBlockValue
				} )
			);
		},

		// No information saved to the block
		// Data is saved to post meta via attributes
		save: function() {
			return null;
		}
	});
})( window.wp );
```

**Important:** Before you test, you need to enqueue your JavaScript file and its dependencies. Note the WordPress packages used above are `wp.element`, `wp.blocks`, and `wp.components`. Each of these need to be included in the array of dependencies. Update the `myguten-meta-block.php` file adding the enqueue function:

```php
function myguten_enqueue() {
	wp_enqueue_script(
		'myguten-script',
		plugins_url( 'myguten.js', __FILE__ ),
		array( 'wp-blocks', 'wp-element', 'wp-components' )
	);
}
add_action( 'enqueue_block_editor_assets', 'myguten_enqueue' );
```

You can now edit a draft post and add a Meta Block to the post. You will see your field that you can type a value in. When you save the post, either as a draft or published, the post meta value will be saved too. You can verify by saving and reloading your draft, the form will still be filled in on reload.

![Meta Block](https://raw.githubusercontent.com/WordPress/gutenberg/master/docs/designers-developers/developers/tutorials/metabox/meta-block.png)

You can now use the post meta data in a template, or another block. See next section for [using post meta data](/docs/designers-developers/developers/tutorials/metabox/meta-block-4-use-data.md). You could also confirm the data is saved by checking the database table `wp_postmeta` and confirm the new post id contains the new field data.

