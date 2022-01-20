/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { createRegistrySelector } from '@wordpress/data';
import deprecated from '@wordpress/deprecated';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Returns the item that is enabled in a given scope.
 *
 * @param {Object} state    Global application state.
 * @param {string} itemType Type of item.
 * @param {string} scope    Item scope.
 *
 * @return {?string|null} The item that is enabled in the passed scope and type.
 */
function getSingleEnableItem( state, itemType, scope ) {
	return get( state.enableItems.singleEnableItems, [ itemType, scope ] );
}

/**
 * Returns the complementary area that is active in a given scope.
 *
 * @param {Object} state Global application state.
 * @param {string} scope Item scope.
 *
 * @return {string} The complementary area that is active in the given scope.
 */
export function getActiveComplementaryArea( state, scope ) {
	return getSingleEnableItem( state, 'complementaryArea', scope );
}

/**
 * Returns a boolean indicating if an item is enabled or not in a given scope.
 *
 * @param {Object} state    Global application state.
 * @param {string} itemType Type of item.
 * @param {string} scope    Scope.
 * @param {string} item     Item to check.
 *
 * @return {boolean|undefined} True if the item is enabled, false otherwise if the item is explicitly disabled, and undefined if there is no information for that item.
 */
function isMultipleEnabledItemEnabled( state, itemType, scope, item ) {
	return get( state.enableItems.multipleEnableItems, [
		itemType,
		scope,
		item,
	] );
}

/**
 * Returns a boolean indicating if an item is pinned or not.
 *
 * @param {Object} state Global application state.
 * @param {string} scope Scope.
 * @param {string} item  Item to check.
 *
 * @return {boolean} True if the item is pinned and false otherwise.
 */
export function isItemPinned( state, scope, item ) {
	return (
		isMultipleEnabledItemEnabled( state, 'pinnedItems', scope, item ) !==
		false
	);
}

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
		deprecated( `select( 'core/interface' ).isFeatureActive`, {
			since: '6.0',
			alternative: `select( 'core/preferences' ).get`,
		} );

		return !! select( preferencesStore ).get( scope, featureName );
	}
);
