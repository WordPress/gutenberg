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

const createQuoteBlockWithContent = ( content = '' ) => {
	return {
		blockType: 'quote',
		cite: '',
		content
	};
};

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
			style: rawBlock.attrs.style,
			cite,
			content,
		};
	},
	serialize: ( block ) => {
		const style = block.style || 'style1';
		const rawContent = [
			`<blockquote class="quote-${ style }">`,
			block.content,
			`<footer>${ block.cite }</footer>`,
			'</blockquote>'
		].join( '' );

		return {
			blockType: 'quote',
			attrs: { style: style },
			rawContent
		};
	},
	create: createQuoteBlockWithContent,
	transformations: [
		{
			blocks: [ 'text', 'heading' ],
			transform: ( block ) => createQuoteBlockWithContent( block.content )
		}
	]
} );
