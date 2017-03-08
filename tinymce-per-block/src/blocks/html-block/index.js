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
			caption: rawBlock.caption
		};
	},
	serialize: ( block ) => {
		return {
			blockType: 'html',
			attrs: { align: block.align },
			rawContent: block.content,
			caption: block.caption
		};
	},
	create: () => {
		return {
			blockType: 'html',
			content: '',
			align: 'no-align',
			caption: ''
		};
	}
} );
