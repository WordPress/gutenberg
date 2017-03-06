/**
 * External dependencies
 */
import { registerBlock } from 'wp-blocks';
import { EditorTableIcon } from 'dashicons';

/**
 * Internal dependencies
 */
import form from './form';

registerBlock( 'html', {
	title: 'HTML',
	form: form,
	icon: EditorTableIcon,
	parse: ( rawBlock ) => {
		return {
			blockType: 'html',
			align: rawBlock.attrs.align || 'no-align',
			content: rawBlock.rawContent,
		};
	},
	serialize: ( block ) => {
		return {
			blockType: 'html',
			attrs: { /* align: block.align */ },
			rawContent: block.content
		};
	}
} );
