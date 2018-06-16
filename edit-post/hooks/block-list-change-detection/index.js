/**
 * External dependencies
 */
import { differenceBy, camelCase } from 'lodash';

/**
 * WordPress dependencies
 */
import { doAction } from '@wordpress/hooks';
import { subscribe, select } from '@wordpress/data';

/**
 * A compare helper for lodash's difference by
 *
 * @param {Component} block A block object.
 * @return {string} block.uid The uid of the block object for comparison.
 */
const compareBlocks = ( block ) => {
	return block.uid;
};

/**
 * A change listener for blocks
 *
 * The subscribe on the 'core/editor' getBlocks() function fires on any change,
 * not just additions/removals. Therefore we actually compare the array with a
 * previous state and look for changes in length or uid.
 *
 * @param  {function} selector Selector.
 * @param  {function} listener Listener.
 * @return {function}          Listener creator.
 */
const onBlocksChangeListener = ( selector, listener ) => {
	let previousBlocks = selector();
	return () => {
		const selectedBlocks = selector();

		// For performance reasons we first check the cheap length change,
		// before we actuallly do a deep object comparison
		if ( selectedBlocks.length !== previousBlocks.length ) {
			// The block list length has changed, so there is obviously a change event happening
			listener( selectedBlocks, previousBlocks );
			previousBlocks = selectedBlocks;
		} else if ( differenceBy( selectedBlocks, previousBlocks, compareBlocks ).length ) {
			// A deep inspection has shown, that the list has changed
			listener( selectedBlocks, previousBlocks, differenceBy( selectedBlocks, previousBlocks, compareBlocks ) );
			previousBlocks = selectedBlocks;
		}
	};
};

/**
 * Subscribe to block data
 *
 * This function subscribes to block data, compares old and new states upon
 * change and fires actions accordingly.
 */
subscribe( onBlocksChangeListener( select( 'core/editor' ).getBlocks, ( blocks, oldBlocks, difference = null ) => {
	const addedBlocks = differenceBy( blocks, oldBlocks, compareBlocks );
	const deletedBlocks = differenceBy( oldBlocks, blocks, compareBlocks );

	// When the length is equal, but a change hapened, we have a transformation
	if ( oldBlocks.length === blocks.length && difference ) {
		// A block has been deleted
		for ( const i in deletedBlocks ) {
			const block = deletedBlocks[ i ];
			const actionName = 'blocks.transformed.from.' + camelCase( block.name );
			doAction( actionName, block );
		}

		// A block has been added
		for ( const i in addedBlocks ) {
			const block = addedBlocks[ i ];
			const actionName = 'blocks.transformed.to.' + camelCase( block.name );
			doAction( actionName, block );
		}
	} else {
		// A block has been added
		for ( const i in addedBlocks ) {
			const block = addedBlocks[ i ];
			const actionName = 'blocks.added.' + camelCase( block.name );
			doAction( actionName, block );
		}

		// A block has been deleted
		for ( const i in deletedBlocks ) {
			const block = deletedBlocks[ i ];
			const actionName = 'blocks.removed.' + camelCase( block.name );
			doAction( actionName, block );
		}
	}
} ) );
