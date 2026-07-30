/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

/**
 * Returns true if reusable block is in the editing state.
 *
 * @deprecated
 *
 * @param {Object} state    Global application state.
 * @param {number} clientId the clientID of the block.
 * @return {boolean} Whether the reusable block is in the editing state.
 */
export function __experimentalIsEditingReusableBlock( state, clientId ) {
	deprecated(
		"wp.data.select( 'core/reusable-blocks' ).__experimentalIsEditingReusableBlock",
		{
			since: '7.1',
		}
	);
	return state.isEditingReusableBlock[ clientId ];
}
