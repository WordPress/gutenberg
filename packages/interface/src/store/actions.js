/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Returns an action object used in signalling that an active area should be changed.
 *
 * @param {string} itemType Type of item.
 * @param {string} scope    Item scope.
 * @param {string} item     Item identifier.
 *
 * @return {Object} Action object.
 */
function setSingleEnableItem( itemType, scope, item ) {
	return {
		type: 'SET_SINGLE_ENABLE_ITEM',
		itemType,
		scope,
		item,
	};
}

/**
 * Returns an action object used in signalling that a complementary item should be enabled.
 *
 * @param {string} scope Complementary area scope.
 * @param {string} area  Area identifier.
 *
 * @return {Object} Action object.
 */
export function enableComplementaryArea( scope, area ) {
	return setSingleEnableItem( 'complementaryArea', scope, area );
}

/**
 * Returns an action object used in signalling that the complementary area of a given scope should be disabled.
 *
 * @param {string} scope Complementary area scope.
 *
 * @return {Object} Action object.
 */
export function disableComplementaryArea( scope ) {
	return setSingleEnableItem( 'complementaryArea', scope, undefined );
}

/**
 * Returns an action object to make an area enabled/disabled.
 *
 * @param {string}  itemType Type of item.
 * @param {string}  scope    Item scope.
 * @param {string}  item     Item identifier.
 * @param {boolean} isEnable Boolean indicating if an area should be pinned or not.
 *
 * @return {Object} Action object.
 */
function setMultipleEnableItem( itemType, scope, item, isEnable ) {
	return {
		type: 'SET_MULTIPLE_ENABLE_ITEM',
		itemType,
		scope,
		item,
		isEnable,
	};
}

/**
 * Returns an action object used in signalling that an item should be pinned.
 *
 * @param {string} scope  Item scope.
 * @param {string} itemId Item identifier.
 *
 * @return {Object} Action object.
 */
export function pinItem( scope, itemId ) {
	return setMultipleEnableItem( 'pinnedItems', scope, itemId, true );
}

/**
 * Returns an action object used in signalling that an item should be unpinned.
 *
 * @param {string} scope  Item scope.
 * @param {string} itemId Item identifier.
 *
 * @return {Object} Action object.
 */
export function unpinItem( scope, itemId ) {
	return setMultipleEnableItem( 'pinnedItems', scope, itemId, false );
}

/**
 * Returns an action object used in signalling that a feature should be toggled.
 *
 * @param {string} scope       The feature scope (e.g. core/edit-post).
 * @param {string} featureName The feature name.
 */
export function toggleFeature( scope, featureName ) {
	deprecated( `dispatch( 'core/interface' ).toggleFeature`, {
		since: '6.0',
		alternative: `dispatch( 'core/preferences' ).toggle`,
	} );

	return function ( { registry } ) {
		registry.dispatch( preferencesStore ).toggle( scope, featureName );
	};
}

/**
 * Returns an action object used in signalling that a feature should be set to
 * a true or false value
 *
 * @param {string}  scope       The feature scope (e.g. core/edit-post).
 * @param {string}  featureName The feature name.
 * @param {boolean} value       The value to set.
 *
 * @return {Object} Action object.
 */
export function setFeatureValue( scope, featureName, value ) {
	deprecated( `dispatch( 'core/interface' ).setFeatureValue`, {
		since: '6.0',
		alternative: `dispatch( 'core/preferences' ).set`,
	} );

	return function ( { registry } ) {
		registry
			.dispatch( preferencesStore )
			.set( scope, featureName, !! value );
	};
}

/**
 * Returns an action object used in signalling that defaults should be set for features.
 *
 * @param {string}                  scope    The feature scope (e.g. core/edit-post).
 * @param {Object<string, boolean>} defaults A key/value map of feature names to values.
 *
 * @return {Object} Action object.
 */
export function* setFeatureDefaults( scope, defaults ) {
	deprecated( `dispatch( 'core/interface' ).setFeatureDefaults`, {
		since: '6.0',
		alternative: `dispatch( 'core/preferences' ).setDefaults`,
	} );

	return function ( { registry } ) {
		registry.dispatch( preferencesStore ).setDefaults( scope, defaults );
	};
}
