# Create Meta Block

With the meta field registered in the previous step, next you will create a new block used to display the field value to the user. See the [Block Tutorial](/docs/how-to-guides/block-tutorial/README.md) for a deeper understanding of creating custom blocks.

For this block, you will use the TextControl component, which is similar to an HTML input text field. For additional components, check out the [Component Reference](/packages/components/README.md).

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

**Important:** Before you test, you need to enqueue your JavaScript file and its dependencies. Note the WordPress packages used above are `wp.element`, `wp.blocks`, `wp.components`, `wp.data`, and `wp.coreData`. Each of these need to be included in the array of dependencies. Update the `myguten-meta-block.php` file adding the enqueue function:

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

You can now edit a draft post and add a Meta Block to the post. You will see your field that you can type a value in. When you save the post, either as a draft or published, the post meta value will be saved too. You can verify by saving and reloading your draft, the form will still be filled in on reload.

![Meta Block](https://raw.githubusercontent.com/WordPress/gutenberg/HEAD/docs/how-to-guides/metabox/meta-block.png)

You can now use the post meta data in a template, or another block. See next section for [using post meta data](/docs/how-to-guides/metabox/meta-block-4-use-data.md). You could also confirm the data is saved by checking the database table `wp_postmeta` and confirm the new post id contains the new field data.
