/**
 * WordPress dependencies
 */
import { createRegistryControl } from '@wordpress/data';

export const SELECT_NEXT_BLOCK = createRegistryControl( ( registry ) => ( action ) => {
	const { clientId, isReverse } = action;
	const {
		getPreviousBlockClientId,
		getNextBlockClientId,
		getSelectedBlockClientId,
	} = registry.select( 'core/editor' );

	let targetClientId;
	if ( isReverse ) {
		targetClientId = getPreviousBlockClientId( clientId );
	} else {
		targetClientId = getNextBlockClientId( clientId );
	}

	// Only dispatch select block action if the currently selected block is
	// is not already the block we want to be selected.
	if ( ! targetClientId || targetClientId === getSelectedBlockClientId() ) {
		return;
	}

	// When selecting in reverse, invert the default focus transition
	// behavior, selecting the last available focusable.
	let initialPosition;
	if ( isReverse ) {
		initialPosition = -1;
	}

	const { selectBlock } = registry.dispatch( 'core/editor' );
	selectBlock( targetClientId, initialPosition );
} );
