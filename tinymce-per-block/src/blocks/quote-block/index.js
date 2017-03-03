/**
 * External dependencies
 */
import { registerBlock } from 'wp-blocks';
import {
	EditorQuoteIcon,
} from 'dashicons';

/**
 * Internal dependencies
 */
import form from './form';

registerBlock( 'quote', {
	title: 'Quote',
	form: form,
	icon: EditorQuoteIcon,
	parse: ( rawBlock ) => {
		const div = document.createElement( 'div' );
		div.innerHTML = rawBlock.rawContent;
		if (
			div.childNodes.length !== 1 ||
			div.firstChild.nodeName !== 'P'
		) {
			return false;
		}

		return {
			blockType: 'quote',
			cite: rawBlock.attrs.cite || '',
			content: rawBlock.rawContent,
		};
	},
	serialize: ( block ) => {
		return {
			blockType: 'quote',
			attrs: { cite: block.cite },
			rawContent: block.content
		};
	}
} );
