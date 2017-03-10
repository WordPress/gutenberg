/**
 * External dependencies
 */
import { registerBlock } from 'wp-blocks';
import { EditorParagraphIcon } from 'dashicons';

/**
 * Internal dependencies
 */
import form from './form';
import { mergeInlineTextBlocks } from 'utils/state';

const createTextBlockWithContent = ( content = '' ) => {
	return {
		blockType: 'text',
		align: 'no-align',
		content
	};
};

registerBlock( 'text', {
	title: 'Text',
	form: form,
	icon: EditorParagraphIcon,
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
			blockType: 'text',
			align: rawBlock.attrs.align || 'no-align',
			content: div.firstChild.innerHTML,
		};
	},
	serialize: ( block ) => {
		const div = document.createElement( 'div' );
		div.innerHTML = block.content;
		// Should probably be handled in the form
		const content = div.childNodes.length === 1 && div.firstChild.nodeName === 'P'
			? div.firstChild.innerHTML
			: block.content;
		const rawContent = `<p style="text-align: ${ block.align };">${ content }</p>`;

		return {
			blockType: 'text',
			attrs: { align: block.align },
			rawContent
		};
	},
	create: () => createTextBlockWithContent,
	transformations: [
		{
			blocks: [ 'heading', 'quote' ],
			transform: ( block ) => createTextBlockWithContent( block.content )
		}
	],
	merge: [ {
		blocks: [ 'text', 'quote', 'heading' ],
		merge: mergeInlineTextBlocks
	} ]
} );
