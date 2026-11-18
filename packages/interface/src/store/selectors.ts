import { createRegistrySelector } from '@wordpress/data';
import deprecated from '@wordpress/deprecated';
import { store as preferencesStore } from '@wordpress/preferences';
import {
	normalizeComplementaryAreaScope,
	normalizeComplementaryAreaName,
} from './deprecated';
import type { StoreState } from './types';

/**
 * Returns the complementary area that is active in a given scope.
 *
 * @param state Global application state.
 * @param scope Item scope.
 *
 * @return The complementary area that is active in the given scope.
 */
export const getActiveComplementaryArea = createRegistrySelector(
	( select ) => ( state: StoreState, scope: string ) => {
		scope = normalizeComplementaryAreaScope( scope );
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
	( select ) => ( state: StoreState, scope: string ) => {
		scope = normalizeComplementaryAreaScope( scope );
		const isVisible: boolean | undefined = select( preferencesStore ).get(
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
 * @param state Global application state.
 * @param scope Scope.
 * @param item  Item to check.
 *
 * @return True if the item is pinned and false otherwise.
 */
export const isItemPinned = createRegistrySelector(
	( select ) => ( state: StoreState, scope: string, item: string ) => {
		scope = normalizeComplementaryAreaScope( scope );
		item = normalizeComplementaryAreaName( scope, item );
		const pinnedItems: Record< string, boolean > | undefined = select(
			preferencesStore
		).get( scope, 'pinnedItems' );
		return pinnedItems?.[ item ] ?? true;
	}
);

/**
 * Returns a boolean indicating whether a feature is active for a particular
 * scope.
 *
 * @param state       The store state.
 * @param scope       The scope of the feature (e.g. core/edit-post).
 * @param featureName The name of the feature.
 *
 * @return Is the feature enabled?
 */
export const isFeatureActive = createRegistrySelector(
	( select ) => ( state: StoreState, scope: string, featureName: string ) => {
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
 * @param state     Global application state.
 * @param modalName A string that uniquely identifies the modal.
 *
 * @return Whether the modal is active.
 */
export function isModalActive( state: StoreState, modalName: string ): boolean {
	return state.activeModal === modalName;
}
