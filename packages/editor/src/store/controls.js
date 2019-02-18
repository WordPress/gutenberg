/**
 * WordPress dependencies
 */
import { createRegistryControl } from '@wordpress/data';

export const SELECT_PREVIOUS_BLOCK = createRegistryControl( ( registry ) => ( action ) => {
	const { clientId } = action;
	const { getPreviousBlockClientId } = registry.select( 'core/editor' );
	const { selectBlock } = registry.dispatch( 'core/editor' );

	selectBlock( getPreviousBlockClientId( clientId ), -1 );
} );

export const SELECT_NEXT_BLOCK = createRegistryControl( ( registry ) => ( action ) => {
	const { clientId } = action;
	const { getNextBlockClientId } = registry.select( 'core/editor' );
	const { selectBlock } = registry.dispatch( 'core/editor' );

	selectBlock( getNextBlockClientId( clientId ) );
} );
