/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Set a default complementary area.
 *
 * @param {string} scope Complementary area scope.
 * @param {string} area  Area identifier.
 *
 * @return {Object} Action object.
 */
export const setDefaultComplementaryArea = ( scope, area ) => ( {
	type: 'SET_DEFAULT_COMPLEMENTARY_AREA',
	scope,
	area,
} );

/**
 * Enable the complementary area.
 *
 * @param {string} scope Complementary area scope.
 * @param {string} area  Area identifier.
 */
export const enableComplementaryArea =
	( scope, area ) =>
	( { registry, dispatch } ) => {
		// Return early if there's no area.
		if ( ! area ) {
			return;
		}

		const isComplementaryAreaVisible = registry
			.select( preferencesStore )
			.get( scope, 'isComplementaryAreaVisible' );

		if ( ! isComplementaryAreaVisible ) {
			registry
				.dispatch( preferencesStore )
				.set( scope, 'isComplementaryAreaVisible', true );
		}

		dispatch( {
			type: 'ENABLE_COMPLEMENTARY_AREA',
			scope,
			area,
		} );
	};

/**
 * Disable the complementary area.
 *
 * @param {string} scope Complementary area scope.
 */
export const disableComplementaryArea =
	( scope ) =>
	( { registry } ) => {
		const isComplementaryAreaVisible = registry
			.select( preferencesStore )
			.get( scope, 'isComplementaryAreaVisible' );

		if ( isComplementaryAreaVisible ) {
			registry
				.dispatch( preferencesStore )
				.set( scope, 'isComplementaryAreaVisible', false );
		}
	};

/**
 * Pins an item.
 *
 * @param {string} scope Item scope.
 * @param {string} item  Item identifier.
 *
 * @return {Object} Action object.
 */
export const pinItem =
	( scope, item ) =>
	( { registry } ) => {
		// Return early if there's no item.
		if ( ! item ) {
			return;
		}

		const pinnedItems = registry
			.select( preferencesStore )
			.get( scope, 'pinnedItems' );

		// The item is already pinned, there's nothing to do.
		if ( pinnedItems?.[ item ] === true ) {
			return;
		}

		registry.dispatch( preferencesStore ).set( scope, 'pinnedItems', {
			...pinnedItems,
			[ item ]: true,
		} );
	};

/**
 * Unpins an item.
 *
 * @param {string} scope Item scope.
 * @param {string} item  Item identifier.
 */
export const unpinItem =
	( scope, item ) =>
	( { registry } ) => {
		// Return early if there's no item.
		if ( ! item ) {
			return;
		}

		const pinnedItems = registry
			.select( preferencesStore )
			.get( scope, 'pinnedItems' );

		registry.dispatch( preferencesStore ).set( scope, 'pinnedItems', {
			...pinnedItems,
			[ item ]: false,
		} );
	};

/**
 * Returns an action object used in signalling that a feature should be toggled.
 *
 * @param {string} scope       The feature scope (e.g. core/edit-post).
 * @param {string} featureName The feature name.
 */
export function toggleFeature( scope, featureName ) {
	return function ( { registry } ) {
		deprecated( `dispatch( 'core/interface' ).toggleFeature`, {
			since: '6.0',
			alternative: `dispatch( 'core/preferences' ).toggle`,
		} );

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
	return function ( { registry } ) {
		deprecated( `dispatch( 'core/interface' ).setFeatureValue`, {
			since: '6.0',
			alternative: `dispatch( 'core/preferences' ).set`,
		} );

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
export function setFeatureDefaults( scope, defaults ) {
	return function ( { registry } ) {
		deprecated( `dispatch( 'core/interface' ).setFeatureDefaults`, {
			since: '6.0',
			alternative: `dispatch( 'core/preferences' ).setDefaults`,
		} );

		registry.dispatch( preferencesStore ).setDefaults( scope, defaults );
	};
}

/**
 * Returns an action object used in signalling that the user opened a modal.
 *
 * @param {string} name A string that uniquely identifies the modal.
 *
 * @return {Object} Action object.
 */
export function openModal( name ) {
	return {
		type: 'OPEN_MODAL',
		name,
	};
}

/**
 * Returns an action object signalling that the user closed a modal.
 *
 * @return {Object} Action object.
 */
export function closeModal() {
	return {
		type: 'CLOSE_MODAL',
	};
}
