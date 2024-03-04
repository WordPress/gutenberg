/**
 * WordPress dependencies
 */
import { createRegistrySelector } from '@wordpress/data';
import deprecated from '@wordpress/deprecated';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Returns the complementary area that is active in a given scope.
 *
 * @param {Object} state Global application state.
 * @param {string} scope Item scope.
 *
 * @return {string | null | undefined} The complementary area that is active in the given scope.
 */
export const getActiveComplementaryArea = createRegistrySelector(
	( select ) => ( state, scope ) => {
		const isComplementaryAreaVisible = select( preferencesStore ).get(
			scope,
			'isComplementaryAreaVisible'
		);

		// Return `undefined` to indicate that the user has never toggled
		// visibility, this is the vanilla default. Other code relies on this
		// nuance in the return value.
		if ( isComplementaryAreaVisible === undefined ) {
			return undefined;
		}

		// Return `null` to indicate the user hid the complementary area.
		if ( isComplementaryAreaVisible === false ) {
			return null;
		}

		return state?.complementaryAreas?.[ scope ];
	}
);

export const isComplementaryAreaLoading = createRegistrySelector(
	( select ) => ( state, scope ) => {
		const isVisible = select( preferencesStore ).get(
			scope,
			'isComplementaryAreaVisible'
		);
		const identifier = state?.complementaryAreas?.[ scope ];

		return isVisible && identifier === undefined;
	}
);

/**
 * Returns a boolean indicating if an item is pinned or not.
 *
 * @param {Object} state Global application state.
 * @param {string} scope Scope.
 * @param {string} item  Item to check.
 *
 * @return {boolean} True if the item is pinned and false otherwise.
 */
export const isItemPinned = createRegistrySelector(
	( select ) => ( state, scope, item ) => {
		const pinnedItems = select( preferencesStore ).get(
			scope,
			'pinnedItems'
		);
		return pinnedItems?.[ item ] ?? true;
	}
);

/**
 * Returns a boolean indicating whether a feature is active for a particular
 * scope.
 *
 * @param {Object} state       The store state.
 * @param {string} scope       The scope of the feature (e.g. core/edit-post).
 * @param {string} featureName The name of the feature.
 *
 * @return {boolean} Is the feature enabled?
 */
export const isFeatureActive = createRegistrySelector(
	( select ) => ( state, scope, featureName ) => {
		deprecated(
			`select( 'core/interface' ).isFeatureActive( scope, featureName )`,
			{
				since: '6.0',
				alternative: `select( 'core/preferences' ).get( scope, featureName )`,
			}
		);

		return !! select( preferencesStore ).get( scope, featureName );
	}
);

/**
 * Returns true if a modal is active, or false otherwise.
 *
 * @param {Object} state     Global application state.
 * @param {string} modalName A string that uniquely identifies the modal.
 *
 * @return {boolean} Whether the modal is active.
 */
export function isModalActive( state, modalName ) {
	return state.activeModal === modalName;
}
