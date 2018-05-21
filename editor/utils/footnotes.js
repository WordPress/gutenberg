/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { dispatch, select } from '@wordpress/data';

/**
 * Checks if the updated blocks contain footnotes.
 *
 * @param {Object} updatedBlocks Object containing the updated blocks in a hierarchical
 * form with a blockFootnotes property which contains the new footnotes.
 *
 * @return {boolean} True if the updated blocks contain footnotes and false if they don't.
 */
const doUpdatedBlocksContainFootnotes = function( updatedBlocks ) {
	for ( let i = 0; i < Object.keys( updatedBlocks ).length; i++ ) {
		const uid = Object.keys( updatedBlocks )[ i ];

		if ( updatedBlocks[ uid ] && updatedBlocks[ uid ].length ) {
			return true;
		}
	}

	return false;
};

/**
 * Checks if the provided list of blocks contain footnotes. If a block is in the list of
 * updatedBlocks, the list of footnotes from updatedBlocks takes precedence. If a block
 * uid matches the removedBlock parameter, the footnotes of that block and its children
 * are ignored.
 *
 * @param {Array}   blocks        Array of blocks from the post
 * @param {Object}  updatedBlocks Object containing the updated blocks in a hierarchical
 * form with a blockFootnotes property which contains the new footnotes.
 * @param {?string} removedBlock  Uid of the removed block.
 *
 * @return {boolean} True if the blocks contain footnotes and false if they don't. It
 * also returns false if the array of blocks is empty.
 */
const doBlocksContainFootnotes = function( blocks, updatedBlocks, removedBlock ) {
	if ( ! blocks ) {
		return false;
	}

	for ( let i = 0; i < blocks.length; i++ ) {
		const block = blocks[ i ];

		if ( block.uid === removedBlock ) {
			continue;
		}

		const blockFootnotes = updatedBlocks.hasOwnProperty( block.uid ) ?
			updatedBlocks[ block.uid ] : get( block, [ 'attributes', 'blockFootnotes' ] );
		if ( blockFootnotes && blockFootnotes.length ) {
			return true;
		}

		if ( doBlocksContainFootnotes( block.innerBlocks, updatedBlocks, removedBlock ) ) {
			return true;
		}
	}

	return false;
};

/**
 * Checks if post being edited contains footnotes.
 *
 * @param {Object}  updatedBlocks Object containing the updated blocks in a hierarchical
 * form with a blockFootnotes property which contains the new footnotes.
 * @param {?string} removedBlock  Uid of the removed block.
 *
 * @return {boolean} True if the current edited post contains footnotes and
 * false if it doesn't.
 */
const doesPostContainFootnotes = function( updatedBlocks, removedBlock ) {
	if ( doUpdatedBlocksContainFootnotes( updatedBlocks ) ) {
		return true;
	}

	const blocks = select( 'core/editor' ).getBlocks();

	return doBlocksContainFootnotes( blocks, updatedBlocks, removedBlock );
};

/**
 * Inserts the footnotes block or removes it depending on whether the post blocks contain
 * footnotes or not.
 *
 * @param {Object}  updatedBlocks Object containing the updated blocks in a hierarchical
 * form with a blockFootnotes property which contains the new footnotes.
 * @param {?string} removedBlock  Uid of the removed block.
 */
export function updateFootnotesBlockVisibility( updatedBlocks, removedBlock = null ) {
	const { insertFootnotesBlock, removeBlock } = dispatch( 'core/editor' );
	const footnotesBlockUid = select( 'core/editor' ).getFootnotesBlockUid();
	const shouldFootnotesBlockBeVisible = doesPostContainFootnotes( updatedBlocks, removedBlock );

	if ( ! footnotesBlockUid && shouldFootnotesBlockBeVisible ) {
		insertFootnotesBlock();
	} else if ( footnotesBlockUid && ! shouldFootnotesBlockBeVisible ) {
		removeBlock( footnotesBlockUid );
	}
}
