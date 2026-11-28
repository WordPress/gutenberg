import type { ThunkArgs } from '@wordpress/data';
import deprecated from '@wordpress/deprecated';
import { store as preferencesStore } from '@wordpress/preferences';
import {
	normalizeComplementaryAreaScope,
	normalizeComplementaryAreaName,
} from './deprecated';
import type {
	CloseModalAction,
	OpenModalAction,
	SetDefaultComplementaryAreaAction,
} from './types';

/**
 * Set a default complementary area.
 *
 * @param scope Complementary area scope.
 * @param area  Area identifier.
 *
 * @return Action object.
 */
export const setDefaultComplementaryArea = (
	scope: string,
	area: string
): SetDefaultComplementaryAreaAction => {
	scope = normalizeComplementaryAreaScope( scope );
	area = normalizeComplementaryAreaName( scope, area );
	return {
		type: 'SET_DEFAULT_COMPLEMENTARY_AREA',
		scope,
		area,
	};
};

/**
 * Enable the complementary area.
 *
 * @param scope Complementary area scope.
 * @param area  Area identifier.
 */
export const enableComplementaryArea =
	( scope: string, area: string ) =>
	( { registry, dispatch }: ThunkArgs ) => {
		// Return early if there's no area.
		if ( ! area ) {
			return;
		}
		scope = normalizeComplementaryAreaScope( scope );
		area = normalizeComplementaryAreaName( scope, area );

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
 * @param scope Complementary area scope.
 */
export const disableComplementaryArea =
	( scope: string ) =>
	( { registry }: ThunkArgs ) => {
		scope = normalizeComplementaryAreaScope( scope );
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
 * @param scope Item scope.
 * @param item  Item identifier.
 *
 * @return Action object.
 */
export const pinItem =
	( scope: string, item: string ) =>
	( { registry }: ThunkArgs ) => {
		// Return early if there's no item.
		if ( ! item ) {
			return;
		}

		scope = normalizeComplementaryAreaScope( scope );
		item = normalizeComplementaryAreaName( scope, item );
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
 * @param scope Item scope.
 * @param item  Item identifier.
 */
export const unpinItem =
	( scope: string, item: string ) =>
	( { registry }: ThunkArgs ) => {
		// Return early if there's no item.
		if ( ! item ) {
			return;
		}

		scope = normalizeComplementaryAreaScope( scope );
		item = normalizeComplementaryAreaName( scope, item );
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
 * @param scope       The feature scope (e.g. core/edit-post).
 * @param featureName The feature name.
 */
export function toggleFeature( scope: string, featureName: string ) {
	return function ( { registry }: ThunkArgs ) {
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
 * @param scope       The feature scope (e.g. core/edit-post).
 * @param featureName The feature name.
 * @param value       The value to set.
 *
 * @return Action object.
 */
export function setFeatureValue(
	scope: string,
	featureName: string,
	value: boolean
) {
	return function ( { registry }: ThunkArgs ) {
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
 * @param scope    The feature scope (e.g. core/edit-post).
 * @param defaults A key/value map of feature names to values.
 *
 * @return Action object.
 */
export function setFeatureDefaults(
	scope: string,
	defaults: Record< string, boolean >
) {
	return function ( { registry }: ThunkArgs ) {
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
 * @param name A string that uniquely identifies the modal.
 *
 * @return Action object.
 */
export function openModal( name: string ): OpenModalAction {
	return {
		type: 'OPEN_MODAL',
		name,
	};
}

/**
 * Returns an action object signalling that the user closed a modal.
 *
 * @return Action object.
 */
export function closeModal(): CloseModalAction {
	return {
		type: 'CLOSE_MODAL',
	};
}
