/**
 * WordPress dependencies
 */
import { dispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { debounce } from 'lodash';

/**
 * Returns an array of block clientIds found under the cursor.
 * Block clientIds are ordered from child to parent.
 *
 * @param {Object} event Mouse event object.
 *
 * @return {string[]} Array of block clientIds.
 */
export function getHoveredBlocksFromCursor( event ) {
	const hoveredElements = document.elementsFromPoint(
		event.clientX,
		event.clientY
	);
	const blockIds = [];
	hoveredElements.forEach( ( element ) => {
		if ( element.dataset.block ) {
			blockIds.push( element.dataset.block );
		}
	} );
	return blockIds;
}

/**
 * Conditionally evaluates and dispatches hovered block clientIds to the block-editor store.
 *
 * @param {Object} event Mouse event object.
 */
export const evaluateHoveredBlocks = debounce(
	( event ) => {
		// To accurately determine which blocks are hovered we must look at the elements under the cursor.
		// Internal block inserters will fire events like mouseleave for blocks they are visually contained within,
		// which makes an add/remove by clientId per individual block approach inaccurate.
		const hoveredBlocks = getHoveredBlocksFromCursor( event );

		dispatch( 'core/block-editor' ).__experimentalSetHoveredBlocks(
			hoveredBlocks
		);
	},
	// Debounce this on 20ms to ensure we do not unnecessarily evaluate and dispatch
	// multiple times when this is called simultaneously from groups of nested blocks.
	20,
	// Apply a maxWait to ensure this still fires during lots of mouse movement.
	{ maxWait: 50 }
);
