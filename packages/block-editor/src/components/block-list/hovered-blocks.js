/**
 * WordPress dependencies
 */
import { select, dispatch } from '@wordpress/data';

// To accurately determine which blocks are hovered we must look at the elements under the cursor.
// Internal block inserters will fire events like mouseleave for blocks they are visually contained within,
// which makes an add/remove by clientId per individual block approach inaccurate.
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

export function evaluateHoveredBlocks( event ) {
	// Check event data for the last time this was set.
	// This prevents needlessly rerunning the parse and dispatch for nested blocks
	// who share boundaries that trigger the mouse events at or around the same time.
	const { time, mouseCoords } =
		select(
			'core/block-editor'
		).__experimentalGetHoveredBlocksEventData() || {};
	const eventCoords = `${ event.clientX }-${ event.clientY }`;
	if ( mouseCoords !== eventCoords || event.timeStamp - ( time || 0 ) > 50 ) {
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
