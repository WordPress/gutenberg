/**
 * External dependencies
 */
import { differenceBy, camelCase, forEach } from 'lodash';

/**
 * WordPress dependencies
 */
import { doAction } from '@wordpress/hooks';
import { subscribe, select } from '@wordpress/data';

/**
 * A compare helper for lodash's differenceBy function
 *
 * @param  {Component} block      A block object.
 * @return {string}    block.uid  The uid of the block object for comparison.
 */
const compareBlocks = ( block ) => {
	return block.uid;
};

/**
 * A change listener for blocks from the 'core/editor' store that fires a
 * function upon a change in the block collection.
 *
 * The subscribe on the 'core/editor' getBlocks() function fires on any change,
 * not just additions/removals. Therefore we actually compare the array with a
 * previous state and look for changes in length or uid.
 *
 * @param  {function} selector Selector. A collection of object that are watched.
 * @param  {function} listener Listener. A function beeing called when selector changes.
 * @return {function}          Listener creator.
 */
const onBlocksChangeListener = ( selector, listener ) => {
	let previousBlocks = selector();
	return () => {
		const selectedBlocks = selector();

		// Check to see if the number of blocks has changed. This is faster than a
		// deep object compare and signifies a change event should be fired.
		if ( selectedBlocks.length !== previousBlocks.length ) {
			listener( selectedBlocks, previousBlocks );
			previousBlocks = selectedBlocks;
		} else {
			// The constant 'hasChanged' signals, that the blockList was updated, allthough the number of blocks remaind the same
			const hasChanged = ( differenceBy( selectedBlocks, previousBlocks, compareBlocks ).length > 0 ) ? true : false;
			if ( hasChanged ) {
				listener( selectedBlocks, previousBlocks, true );
				previousBlocks = selectedBlocks;
			}
		}
	};
};

/**
 * Loop over a collection of blocks and perform an action with the block name.
 *
 * @param  {string} actionName  The name of the action to be performed
 * @param  {Array}  blocks      The collection of blocks for which the action shall be called
 */
const doActionForBlocks = ( actionName, blocks ) => {
	if ( typeof blocks !== 'object' || blocks.length < 1 ) {
		return;
	}

	forEach( blocks, ( block ) => {
		const finalActionName = `${ actionName }.${ camelCase( block.name ) }`;
		doAction( finalActionName, block );
	} );
};

/**
 * Subscribe to the blockList data from the 'core/editor' store to perform actions upon list change.
 *
 * This function subscribes to block data, compares old and new states upon
 * change and fires actions accordingly.
 */
subscribe( onBlocksChangeListener( select( 'core/editor' ).getBlocks, ( blocks, oldBlocks, hasChanged = false ) => {
	const addedBlocks = differenceBy( blocks, oldBlocks, compareBlocks );
	const deletedBlocks = differenceBy( oldBlocks, blocks, compareBlocks );

	// When the length is equal, but a change hapened, we have a transformation
	if ( oldBlocks.length === blocks.length && hasChanged ) {
		// A block has been deleted
		doActionForBlocks( 'blocks.transformed.from', deletedBlocks );

		// A block has been added
		doActionForBlocks( 'blocks.transformed.to', addedBlocks );
	} else {
		// A block has been deleted
		doActionForBlocks( 'blocks.removed', deletedBlocks );

		// A block has been added
		doActionForBlocks( 'blocks.added', addedBlocks );
	}
} ) );
