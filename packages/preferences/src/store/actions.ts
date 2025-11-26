/**
 * Internal dependencies
 */
import type {
	ActionObject,
	StoreState,
	WPPreferencesPersistenceLayer,
} from './types';

/**
 * Returns an action object used in signalling that a preference should be
 * toggled.
 *
 * @param {string} scope The preference scope (e.g. core/edit-post).
 * @param {string} name  The preference name.
 */
export function toggle( scope: string, name: string ) {
	// @ts-expect-error We cannot properly type this until we have a fully-typed datastore
	return function ( { select, dispatch } ) {
		const currentValue = select.get( scope, name );
		dispatch.set( scope, name, ! currentValue );
	};
}

type SetAction = ActionObject<
	'SET_PREFERENCE_VALUE',
	{ scope: string; name: string; value: any }
>;

/**
 * Returns an action object used in signalling that a preference should be set
 * to a value
 *
 * @param {string} scope The preference scope (e.g. core/edit-post).
 * @param {string} name  The preference name.
 * @param {*}      value The value to set.
 *
 * @return {SetAction} Action object.
 */
export function set( scope: string, name: string, value: any ): SetAction {
	return {
		type: 'SET_PREFERENCE_VALUE',
		scope,
		name,
		value,
	};
}

type ScopedDefaults = StoreState[ 'defaults' ][ string ];
type SetDefaultsAction = ActionObject<
	'SET_PREFERENCE_DEFAULTS',
	{ scope: string; defaults: ScopedDefaults }
>;

/**
 * Returns an action object used in signalling that preference defaults should
 * be set.
 *
 * @param scope    The preference scope (e.g. core/edit-post).
 * @param defaults A key/value map of preference names to values.
 *
 * @return Action object.
 */
export function setDefaults(
	scope: string,
	defaults: ScopedDefaults
): SetDefaultsAction {
	return {
		type: 'SET_PREFERENCE_DEFAULTS',
		scope,
		defaults,
	};
}

type SetPersistenceLayerAction< D extends Object > = ActionObject<
	'SET_PERSISTENCE_LAYER',
	{
		persistenceLayer: WPPreferencesPersistenceLayer< D >;
		persistedData: D;
	}
>;

/**
 * Sets the persistence layer.
 *
 * When a persistence layer is set, the preferences store will:
 * - call `get` immediately and update the store state to the value returned.
 * - call `set` with all preferences whenever a preference changes value.
 *
 * `setPersistenceLayer` should ideally be dispatched at the start of an
 * application's lifecycle, before any other actions have been dispatched to
 * the preferences store.
 *
 * @param persistenceLayer The persistence layer.
 *
 * @return Action object.
 */
export async function setPersistenceLayer< D extends Object >(
	persistenceLayer: WPPreferencesPersistenceLayer< D >
): Promise< SetPersistenceLayerAction< D > > {
	const persistedData = await persistenceLayer.get();
	return {
		type: 'SET_PERSISTENCE_LAYER',
		persistenceLayer,
		persistedData,
	};
}

export type AvailableActions =
	| SetAction
	| SetDefaultsAction
	| SetPersistenceLayerAction< any >;
