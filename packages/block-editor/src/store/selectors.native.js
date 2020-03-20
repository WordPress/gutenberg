/**
 * Internal dependencies
 */
import {
	getBlockHierarchyRootClientId,
	getBlockOrder,
	isBlockSelected,
	isBlockInsertionPointVisible,
} from './selectors.js';

export * from './selectors.js';

export function shouldAllowSpaceForFloatingToolbar( state, clientId ) {
	const innerBlocks = getBlockOrder( state, clientId );
	const hasInnerBlocks = innerBlocks.length !== 0;

	const firstChildAdjustsForFloatingToolbar =
		hasInnerBlocks &&
		shouldAllowSpaceForFloatingToolbar( state, innerBlocks[ 0 ] );

	return (
		shouldShowFloatingToolbar( state, clientId ) ||
		firstChildAdjustsForFloatingToolbar
	);
}

export function shouldShowFloatingToolbar( state, clientId ) {
	if ( isBlockInsertionPointVisible( state ) ) {
		return false;
	}

	const rootBlockId = getBlockHierarchyRootClientId( state, clientId );
	const hasRootInnerBlocks = getBlockOrder( state, rootBlockId ).length !== 0;

	return hasRootInnerBlocks && isBlockSelected( state, clientId );
}
