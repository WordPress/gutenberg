/**
 * Returns an action object used in signalling that a preference should be
 * toggled.
 *
 * @param {string} scope The preference scope (e.g. core/edit-post).
 * @param {string} name  The preference name.
 */
export function toggle( scope, name ) {
	return function ( { select, dispatch } ) {
		const currentValue = select.get( scope, name );
		dispatch.set( scope, name, ! currentValue );
	};
}

/**
 * Returns an action object used in signalling that a preference should be set
 * to a value
 *
 * @param {string} scope The preference scope (e.g. core/edit-post).
 * @param {string} name  The preference name.
 * @param {*}      value The value to set.
 *
 * @return {Object} Action object.
 */
export function set( scope, name, value ) {
	return {
		type: 'SET_PREFERENCE_VALUE',
		scope,
		name,
		value,
	};
}

/**
 * Returns an action object used in signalling that preference defaults should
 * be set.
 *
 * @param {string}            scope    The preference scope (e.g. core/edit-post).
 * @param {Object<string, *>} defaults A key/value map of preference names to values.
 *
 * @return {Object} Action object.
 */
export function setDefaults( scope, defaults ) {
	return {
		type: 'SET_PREFERENCE_DEFAULTS',
		scope,
		defaults,
	};
}

/** @typedef {() => Promise<Object>} WPPreferencesPersistenceLayerGet */
/** @typedef {(Object) => void} WPPreferencesPersistenceLayerSet */
/**
 * @typedef WPPreferencesPersistenceLayer
 *
 * @property {WPPreferencesPersistenceLayerGet} get An async function that gets data from the persistence layer.
 * @property {WPPreferencesPersistenceLayerSet} set A function that sets data in the persistence layer.
 */

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
 * @param {WPPreferencesPersistenceLayer} persistenceLayer The persistence layer.
 *
 * @return {Object} Action object.
 */
export async function setPersistenceLayer( persistenceLayer ) {
	const persistedData = await persistenceLayer.get();
	return {
		type: 'SET_PERSISTENCE_LAYER',
		persistenceLayer,
		persistedData,
	};
}
