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
	},
	merge: [ {
		blocks: [ 'html', 'quote', 'text', 'heading' ],
		merge: ( state, index ) => {
			const currentBlock = state.blocks[ index ];
			const blockToMerge = state.blocks[ index + 1 ];
			const newBlock = Object.assign( {}, currentBlock, {
				content: currentBlock.content + blockToMerge.content
			} );
			const newBlocks = [
				...state.blocks.slice( 0, index ),
				newBlock,
				...state.blocks.slice( index + 2 )
			];
			return Object.assign( {}, state, {
				blocks: newBlocks,
				focus: { uid: newBlock.uid, config: { end: true } }
			} );
		}
	} ]
} );
