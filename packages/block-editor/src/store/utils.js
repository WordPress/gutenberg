/**
 * Internal dependencies
 */
import { getBlockRootClientId, getBlockOrder } from './selectors';

export const checkAllowList = ( list, item, defaultResult = null ) => {
	if ( typeof list === 'boolean' ) {
		return list;
	}
	if ( Array.isArray( list ) ) {
		// TODO: when there is a canonical way to detect that we are editing a post
		// the following check should be changed to something like:
		// if ( list.includes( 'core/post-content' ) && getEditorMode() === 'post-content' && item === null )
		if ( list.includes( 'core/post-content' ) && item === null ) {
			return true;
		}
		return list.includes( item );
	}
	return defaultResult;
};

export const checkAllowListRecursive = ( blocks, allowedBlockTypes ) => {
	if ( typeof allowedBlockTypes === 'boolean' ) {
		return allowedBlockTypes;
	}

	const blocksQueue = [ ...blocks ];
	while ( blocksQueue.length > 0 ) {
		const block = blocksQueue.shift();

		const isAllowed = checkAllowList(
			allowedBlockTypes,
			block.name || block.blockName,
			true
		);
		if ( ! isAllowed ) {
			return false;
		}

		block.innerBlocks?.forEach( ( innerBlock ) => {
			blocksQueue.push( innerBlock );
		} );
	}

	return true;
};

export const getAllPatternsDependants = ( state ) => {
	return [
		state.settings.__experimentalBlockPatterns,
		state.settings.__experimentalUserPatternCategories,
		state.settings.__experimentalReusableBlocks,
		state.settings.__experimentalFetchBlockPatterns,
		state.blockPatterns,
	];
};

const EMPTY_ARRAY = [];

export function getSelectedBlockClientIdsUnmemoized( state ) {
	const { selectionStart, selectionEnd } = state.selection;

	if ( ! selectionStart.clientId || ! selectionEnd.clientId ) {
		return EMPTY_ARRAY;
	}

	if ( selectionStart.clientId === selectionEnd.clientId ) {
		return [ selectionStart.clientId ];
	}

	// Retrieve root client ID to aid in retrieving relevant nested block
	// order, being careful to allow the falsey empty string top-level root
	// by explicitly testing against null.
	const rootClientId = getBlockRootClientId( state, selectionStart.clientId );

	if ( rootClientId === null ) {
		return EMPTY_ARRAY;
	}

	const blockOrder = getBlockOrder( state, rootClientId );
	const startIndex = blockOrder.indexOf( selectionStart.clientId );
	const endIndex = blockOrder.indexOf( selectionEnd.clientId );

	if ( startIndex > endIndex ) {
		return blockOrder.slice( endIndex, startIndex + 1 );
	}

	return blockOrder.slice( startIndex, endIndex + 1 );
}
