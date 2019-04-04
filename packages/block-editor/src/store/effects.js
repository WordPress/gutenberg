/**
 * External dependencies
 */
import { findKey } from 'lodash';

/**
 * WordPress dependencies
 */
import { speak } from '@wordpress/a11y';
import {
	getBlockType,
	doBlocksMatchTemplate,
	switchToBlockType,
	synchronizeBlocksWithTemplate,
} from '@wordpress/blocks';
import { _n, sprintf } from '@wordpress/i18n';
import { create, toHTMLString, insert, remove } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import {
	replaceBlocks,
	selectBlock,
	setTemplateValidity,
	resetBlocks,
	selectionChange,
} from './actions';
import {
	getBlock,
	getBlocks,
	getSelectedBlockCount,
	getTemplateLock,
	getTemplate,
	isValidTemplate,
	getSelectionStart,
} from './selectors';

/**
 * Block validity is a function of blocks state (at the point of a
 * reset) and the template setting. As a compromise to its placement
 * across distinct parts of state, it is implemented here as a side-
 * effect of the block reset action.
 *
 * @param {Object} action RESET_BLOCKS action.
 * @param {Object} store  Store instance.
 *
 * @return {?Object} New validity set action if validity has changed.
 */
export function validateBlocksToTemplate( action, store ) {
	const state = store.getState();
	const template = getTemplate( state );
	const templateLock = getTemplateLock( state );

	// Unlocked templates are considered always valid because they act
	// as default values only.
	const isBlocksValidToTemplate = (
		! template ||
		templateLock !== 'all' ||
		doBlocksMatchTemplate( action.blocks, template )
	);

	// Update if validity has changed.
	if ( isBlocksValidToTemplate !== isValidTemplate( state ) ) {
		return setTemplateValidity( isBlocksValidToTemplate );
	}
}

export default {
	MERGE_BLOCKS( action, store ) {
		const { dispatch } = store;
		const state = store.getState();
		const [ firstBlockClientId, secondBlockClientId ] = action.blocks;
		const blockA = getBlock( state, firstBlockClientId );
		const blockAType = getBlockType( blockA.name );

		// Only focus the previous block if it's not mergeable
		if ( ! blockAType.merge ) {
			dispatch( selectBlock( blockA.clientId ) );
			return;
		}

		// We can only merge blocks with similar types
		// thus, we transform the block to merge first
		const blockB = getBlock( state, secondBlockClientId );
		const blockBType = getBlockType( blockB.name );

		// A robust way to retain selection position through various transforms
		// is to insert a special character at the position and then recover it.
		const START_OF_SELECTED_AREA = '\u0086';
		const { identifier, offset } = getSelectionStart( state );
		const html = blockB.attributes[ identifier ];
		const multilineTagB = blockBType.attributes[ identifier ].multiline;
		const value = insert( create( {
			html,
			multilineTag: multilineTagB,
		} ), START_OF_SELECTED_AREA, offset, offset );

		blockB.attributes[ identifier ] = toHTMLString( {
			value,
			multilineTag: multilineTagB,
		} );

		const blocksWithTheSameType = blockA.name === blockB.name ?
			[ blockB ] :
			switchToBlockType( blockB, blockA.name );

		// If the block types can not match, do nothing
		if ( ! blocksWithTheSameType || ! blocksWithTheSameType.length ) {
			return;
		}

		// Calling the merge to update the attributes and remove the block to be merged
		const updatedAttributes = blockAType.merge(
			blockA.attributes,
			blocksWithTheSameType[ 0 ].attributes
		);

		const newIdentifier = findKey( updatedAttributes, ( v ) =>
			typeof v === 'string' && v.indexOf( START_OF_SELECTED_AREA ) !== -1
		);
		const convertedHtml = updatedAttributes[ newIdentifier ];
		const multilineTagA = blockAType.attributes[ newIdentifier ].multiline;
		const convertedValue = create( { html: convertedHtml, multilineTag: multilineTagA } );
		const newOffset = convertedValue.text.indexOf( START_OF_SELECTED_AREA );
		const newValue = remove( convertedValue, newOffset, newOffset + 1 );
		const newHtml = toHTMLString( { value: newValue, multilineTag: multilineTagA } );

		updatedAttributes[ newIdentifier ] = newHtml;

		dispatch( selectionChange(
			blockA.clientId,
			newIdentifier,
			newOffset,
			newOffset
		) );

		dispatch( replaceBlocks(
			[ blockA.clientId, blockB.clientId ],
			[
				{
					...blockA,
					attributes: {
						...blockA.attributes,
						...updatedAttributes,
					},
				},
				...blocksWithTheSameType.slice( 1 ),
			]
		) );
	},
	RESET_BLOCKS: [
		validateBlocksToTemplate,
	],
	MULTI_SELECT: ( action, { getState } ) => {
		const blockCount = getSelectedBlockCount( getState() );

		/* translators: %s: number of selected blocks */
		speak( sprintf( _n( '%s block selected.', '%s blocks selected.', blockCount ), blockCount ), 'assertive' );
	},
	SYNCHRONIZE_TEMPLATE( action, { getState } ) {
		const state = getState();
		const blocks = getBlocks( state );
		const template = getTemplate( state );
		const updatedBlockList = synchronizeBlocksWithTemplate( blocks, template );

		return resetBlocks( updatedBlockList );
	},
};
