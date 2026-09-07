import { createRegistrySelector } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { PATTERN_SLUG_META_KEY } from '../constants';

/**
 * Returns true if pattern is in the editing state.
 *
 * @param {Object} state    Global application state.
 * @param {number} clientId the clientID of the block.
 * @return {boolean} Whether the pattern is in the editing state.
 */
export function isEditingPattern( state, clientId ) {
	return state.isEditingPattern[ clientId ];
}

/**
 * Returns the `wp_block` post that is the edited copy of a registered pattern,
 * or undefined when the pattern is not customized. Triggers loading the user
 * patterns collection.
 *
 * @param {Object} state       Global application state.
 * @param {string} patternName Registered pattern name.
 * @return {Object|undefined} The `wp_block` record.
 */
export const getPatternCustomization = createRegistrySelector(
	( select ) => ( state, patternName ) => {
		if ( ! patternName ) {
			return undefined;
		}
		return select( coreStore )
			.getEntityRecords( 'postType', 'wp_block', { per_page: -1 } )
			?.find(
				( record ) =>
					record.meta?.[ PATTERN_SLUG_META_KEY ] === patternName
			);
	}
);
