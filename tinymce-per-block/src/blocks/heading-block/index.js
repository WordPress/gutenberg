/**
 * External dependencies
 */
import { registerBlock } from 'wp-blocks';
import { EditorHeadingIcon } from 'dashicons';

/**
 * Internal dependencies
 */
import form from './form';
import { mergeInlineTextBlocks } from 'utils/state';

const createHeadingBlockWithContent = ( content = '' ) => {
	return {
		blockType: 'heading',
		size: 'h2',
		content
	};
};

registerBlock( 'heading', {
	title: 'Heading',
	form: form,
	icon: EditorHeadingIcon,
	parse: ( rawBlock ) => {
		const div = document.createElement( 'div' );
		div.innerHTML = rawBlock.rawContent;
		const nodeNames = [ 'H1', 'H2', 'H3' ];
		if (
			div.childNodes.length !== 1 ||
			nodeNames.indexOf( div.firstChild.nodeName ) === -1
		) {
			return false;
		}

		return {
			blockType: 'heading',
			content: div.firstChild.innerHTML,
			size: div.firstChild.nodeName.toLowerCase()
		};
	},
	serialize: ( block ) => {
		const elementName = block.size ? block.size : 'h2';
		const rawContent = `<${ elementName }>` + block.content + `</${ elementName }>`;

		return {
			blockType: 'heading',
			attrs: { size: elementName },
			rawContent
		};
	},
	create: createHeadingBlockWithContent,
	transformations: [ {
		blocks: [ 'text', 'quote' ],
		transform: ( block ) => createHeadingBlockWithContent( block.content )
	} ],
	merge: [ {
		blocks: [ 'text', 'quote', 'heading' ],
		merge: mergeInlineTextBlocks
	} ]
} );
