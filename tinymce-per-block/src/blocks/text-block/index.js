/**
 * External dependencies
 */
import { registerBlock } from 'wp-blocks';
import { EditorTableIcon } from 'dashicons';

/**
 * Internal dependencies
 */
import form from './form';

registerBlock( 'text', {
	title: 'Text',
	form: form,
	icon: EditorTableIcon,
	parse: ( rawBlock ) => {
		return {
			blockType: 'text',
			align: rawBlock.attrs.align || 'no-align',
			content: rawBlock.rawContent,
		};
	},
	serialize: ( block ) => {
		return {
			blockType: 'text',
			attrs: { /* align: block.align */ },
			rawContent: block.content
		};
	}
} );
