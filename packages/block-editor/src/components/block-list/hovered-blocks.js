/**
 * WordPress dependencies
 */
import { select, dispatch } from '@wordpress/data';

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
export function evaluateHoveredBlocks( event ) {
	// Check last event data to determine if we should reevaluate hovered blocks.
	// Requiring different mouseCoords limits unnecessary evaluations triggered from the same
	// event firing from multiple nested blocks.  Checking the time allows us to re-evaluate
	// even when mouseCoords have not changed, such as when scrolling via mouse-wheel.
	// However, this deltaTime checked must be sufficiently long to ensure slow CPUs do not
	// trigger unnecessary recalculations for events triggered simultaneously.
	const { time, mouseCoords } =
		select(
			'core/block-editor'
		).__experimentalGetHoveredBlocksEventData() || {};
	const eventCoords = `${ event.clientX }-${ event.clientY }`;
	if ( mouseCoords !== eventCoords || event.timeStamp - ( time || 0 ) > 50 ) {
		// To accurately determine which blocks are hovered we must look at the elements under the cursor.
		// Internal block inserters will fire events like mouseleave for blocks they are visually contained within,
		// which makes an add/remove by clientId per individual block approach inaccurate.
		const hoveredBlocks = getHoveredBlocksFromCursor( event );

		// Get an updated timeStamp to set on the dispatch.
		// The event.timeStamp may be outdated by this time.
		// In some browsers, simultaneously triggered events may not have the same timestamp,
		// and the difference may correspond to queue and processing time for the previous event.
		// eslint-disable-next-line no-undef
		const dispatchTimeStamp = new Event( 'foobar' ).timeStamp;

		dispatch( 'core/block-editor' ).__experimentalSetHoveredBlocks(
			hoveredBlocks,
			dispatchTimeStamp,
			eventCoords
		);
	}
}
