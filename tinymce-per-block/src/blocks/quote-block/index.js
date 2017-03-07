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
			! (
				div.firstChild.nodeName === 'P' ||
				(
					div.firstChild.nodeName === 'BLOCKQUOTE' &&
					div.firstChild.childNodes.length &&
					div.firstChild.firstChild.nodeName === 'P'
				)
			)
		) {
			return false;
		}

		const content = div.firstChild.nodeName === 'P'
			? div.innerHTML
			: div.firstChild.firstChild.outerHTML;

		const cite = div.firstChild.childNodes.length > 1
			? div.firstChild.lastChild.innerHTML
			: '';

		return {
			blockType: 'quote',
			cite,
			content
		};
	},
	serialize: ( block ) => {
		const rawContent = `<blockquote>${ block.content }<footer>${ block.cite }</footer></blockquote>`;

		return {
			blockType: 'quote',
			attrs: {},
			rawContent
		};
	},
	create: () => {
		return {
			blockType: 'quote',
			cite: '',
			content: ''
		};
	}
} );
