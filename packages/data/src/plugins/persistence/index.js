/**
 * External dependencies
 */
import { merge, isPlainObject, identity } from 'lodash';

/**
 * Internal dependencies
 */
import defaultStorage from './storage/default';
import { combineReducers } from '../../';

/** @typedef {import('../../registry').WPDataRegistry} WPDataRegistry */

/** @typedef {import('../../registry').WPDataPlugin} WPDataPlugin */

/**
 * @typedef {Object} WPDataPersistencePluginOptions Persistence plugin options.
 *
 * @property {Storage} storage    Persistent storage implementation. This must
 *                                at least implement `getItem` and `setItem` of
 *                                the Web Storage API.
 * @property {string}  storageKey Key on which to set in persistent storage.
 *
 */

/**
 * Default plugin storage.
 *
 * @type {Storage}
 */
const DEFAULT_STORAGE = defaultStorage;

/**
 * Default plugin storage key.
 *
 * @type {string}
 */
const DEFAULT_STORAGE_KEY = 'WP_DATA';

/**
 * Higher-order reducer which invokes the original reducer only if state is
 * inequal from that of the action's `nextState` property, otherwise returning
 * the original state reference.
 *
 * @param {Function} reducer Original reducer.
 *
 * @return {Function} Enhanced reducer.
 */
export const withLazySameState = ( reducer ) => ( state, action ) => {
	if ( action.nextState === state ) {
		return state;
	}

	return reducer( state, action );
};

/**
 * Creates a persistence interface, exposing getter and setter methods (`get`
 * and `set` respectively).
 *
 * @param {WPDataPersistencePluginOptions} options Plugin options.
 *
 * @return {Object} Persistence interface.
 */
export function createPersistenceInterface( options ) {
	const {
		storage = DEFAULT_STORAGE,
		storageKey = DEFAULT_STORAGE_KEY,
	} = options;

	let data;

	/**
	 * Returns the persisted data as an object, defaulting to an empty object.
	 *
	 * @return {Object} Persisted data.
	 */
	function getData() {
		if ( data === undefined ) {
			// If unset, getItem is expected to return null. Fall back to
			// empty object.
			const persisted = storage.getItem( storageKey );
			if ( persisted === null ) {
				data = {};
			} else {
				try {
					data = JSON.parse( persisted );
				} catch ( error ) {
					// Similarly, should any error be thrown during parse of
					// the string (malformed JSON), fall back to empty object.
					data = {};
				}
			}
		}

		return data;
	}

	/**
	 * Merges an updated reducer state into the persisted data.
	 *
	 * @param {string} key   Key to update.
	 * @param {*}      value Updated value.
	 */
	function setData( key, value ) {
		data = { ...data, [ key ]: value };
		storage.setItem( storageKey, JSON.stringify( data ) );
	}

	return {
		get: getData,
		set: setData,
	};
}

/**
 * Data plugin to persist store state into a single storage key.
 *
 * @param {WPDataRegistry}                  registry      Data registry.
 * @param {?WPDataPersistencePluginOptions} pluginOptions Plugin options.
 *
 * @return {WPDataPlugin} Data plugin.
 */
function persistencePlugin( registry, pluginOptions ) {
	const persistence = createPersistenceInterface( pluginOptions );

	/**
	 * Creates an enhanced store dispatch function, triggering the state of the
	 * given store name to be persisted when changed.
	 *
	 * @param {Function}       getState  Function which returns current state.
	 * @param {string}         storeName Store name.
	 * @param {?Array<string>} keys      Optional subset of keys to save.
	 *
	 * @return {Function} Enhanced dispatch function.
	 */
	function createPersistOnChange( getState, storeName, keys ) {
		let getPersistedState;
		if ( Array.isArray( keys ) ) {
			// Given keys, the persisted state should by produced as an object
			// of the subset of keys. This implementation uses combineReducers
			// to leverage its behavior of returning the same object when none
			// of the property values changes. This allows a strict reference
			// equality to bypass a persistence set on an unchanging state.
			const reducers = keys.reduce(
				( accumulator, key ) =>
					Object.assign( accumulator, {
						[ key ]: ( state, action ) => action.nextState[ key ],
					} ),
				{}
			);

			getPersistedState = withLazySameState(
				combineReducers( reducers )
			);
		} else {
			getPersistedState = ( state, action ) => action.nextState;
		}

		let lastState = getPersistedState( undefined, {
			nextState: getState(),
		} );

		return () => {
			const state = getPersistedState( lastState, {
				nextState: getState(),
			} );
			if ( state !== lastState ) {
				persistence.set( storeName, state );
				lastState = state;
			}
		};
	}

	return {
		registerStore( storeName, options ) {
			if ( ! options.persist ) {
				return registry.registerStore( storeName, options );
			}

			// Load from persistence to use as initial state.
			const persistedState = persistence.get()[ storeName ];
			if ( persistedState !== undefined ) {
				let initialState = options.reducer( options.initialState, {
					type: '@@WP/PERSISTENCE_RESTORE',
				} );

				if (
					isPlainObject( initialState ) &&
					isPlainObject( persistedState )
				) {
					// If state is an object, ensure that:
					// - Other keys are left intact when persisting only a
					//   subset of keys.
					// - New keys in what would otherwise be used as initial
					//   state are deeply merged as base for persisted value.
					initialState = merge( {}, initialState, persistedState );
				} else {
					// If there is a mismatch in object-likeness of default
					// initial or persisted state, defer to persisted value.
					initialState = persistedState;
				}

				options = {
					...options,
					initialState,
				};
			}

			const store = registry.registerStore( storeName, options );

			store.subscribe(
				createPersistOnChange(
					store.getState,
					storeName,
					options.persist
				)
			);

			return store;
		},
	};
}

/**
 * Move the 'features' object in local storage from the sourceStoreName to the
 * preferences store.
 *
 * @param {Object} persistence     The persistence interface.
 * @param {string} sourceStoreName The name of the store that has persisted
 *                                 preferences to migrate to the preferences
 *                                 package.
 */
export function migrateFeaturePreferencesToPreferencesStore(
	persistence,
	sourceStoreName
) {
	const preferencesStoreName = 'core/preferences';
	const interfaceStoreName = 'core/interface';

	const state = persistence.get();

	// Features most recently (and briefly) lived in the interface package.
	// If data exists there, prioritize using that for the migration. If not
	// also check the original package as the user may have updated from an
	// older block editor version.
	const interfaceFeatures =
		state[ interfaceStoreName ]?.preferences?.features?.[ sourceStoreName ];
	const sourceFeatures = state[ sourceStoreName ]?.preferences?.features;
	const featuresToMigrate = interfaceFeatures
		? interfaceFeatures
		: sourceFeatures;

	if ( featuresToMigrate ) {
		const existingPreferences = state[ preferencesStoreName ]?.preferences;

		// Avoid migrating features again if they've previously been migrated.
		if ( ! existingPreferences?.[ sourceStoreName ] ) {
			// Set the feature values in the interface store, the features
			// object is keyed by 'scope', which matches the store name for
			// the source.
			persistence.set( preferencesStoreName, {
				preferences: {
					...existingPreferences,
					[ sourceStoreName ]: featuresToMigrate,
				},
			} );

			// Remove migrated feature preferences from `interface`.
			if ( interfaceFeatures ) {
				const otherInterfaceState = state[ interfaceStoreName ];
				const otherInterfaceScopes =
					state[ interfaceStoreName ]?.preferences?.features;

				persistence.set( interfaceStoreName, {
					...otherInterfaceState,
					preferences: {
						features: {
							...otherInterfaceScopes,
							[ sourceStoreName ]: undefined,
						},
					},
				} );
			}

			// Remove migrated feature preferences from the source.
			if ( sourceFeatures ) {
				const otherSourceState = state[ sourceStoreName ];
				const sourcePreferences = state[ sourceStoreName ]?.preferences;

				persistence.set( sourceStoreName, {
					...otherSourceState,
					preferences: {
						...sourcePreferences,
						features: undefined,
					},
				} );
			}
		}
	}
}

/**
 * Migrates an individual item inside the `preferences` object for a store.
 *
 * @param {Object}    persistence   The persistence interface.
 * @param {Object}    migrate       An options object that contains details of the migration.
 * @param {string}    migrate.from  The name of the store to migrate from.
 * @param {string}    migrate.scope The scope in the preferences store to migrate to.
 * @param {string}    key           The key in the preferences object to migrate.
 * @param {?Function} convert       A function that converts preferences from one format to another.
 */
export function migrateIndividualPreferenceToPreferencesStore(
	persistence,
	{ from: sourceStoreName, scope },
	key,
	convert = identity
) {
	const preferencesStoreName = 'core/preferences';
	const state = persistence.get();
	const sourcePreference = state[ sourceStoreName ]?.preferences?.[ key ];

	// There's nothing to migrate, exit early.
	if ( sourcePreference === undefined ) {
		return;
	}

	const targetPreference =
		state[ preferencesStoreName ]?.preferences?.[ scope ]?.[ key ];

	// There's existing data at the target, so don't overwrite it, exit early.
	if ( targetPreference ) {
		return;
	}

	const otherScopes = state[ preferencesStoreName ]?.preferences;
	const otherPreferences =
		state[ preferencesStoreName ]?.preferences?.[ scope ];

	// Pass an object with the key and value as this allows the convert
	// function to convert to a data structure that has different keys.
	const convertedPreferences = convert( { [ key ]: sourcePreference } );

	persistence.set( preferencesStoreName, {
		preferences: {
			...otherScopes,
			[ scope ]: {
				...otherPreferences,
				...convertedPreferences,
			},
		},
	} );

	// Remove migrated feature preferences from the source.
	const otherSourceState = state[ sourceStoreName ];
	const allSourcePreferences = state[ sourceStoreName ]?.preferences;
	persistence.set( sourceStoreName, {
		...otherSourceState,
		preferences: {
			...allSourcePreferences,
			[ key ]: undefined,
		},
	} );
}

/**
 * Convert from:
 * ```
 * {
 *     panels: {
 *         tags: {
 *             enabled: true,
 *             opened: true,
 *         },
 *         permalinks: {
 *             enabled: false,
 *             opened: false,
 *         },
 *     },
 * }
 * ```
 *
 * to:
 * {
 *     inactivePanels: [
 *         'permalinks',
 *     ],
 *     openPanels: [
 *         'tags',
 *     ],
 * }
 *
 * @param {Object} preferences A preferences object.
 *
 * @return {Object} The converted data.
 */
export function convertEditPostPanels( preferences ) {
	const panels = preferences?.panels ?? {};
	return Object.keys( panels ).reduce(
		( convertedData, panelName ) => {
			const panel = panels[ panelName ];

			if ( panel?.enabled === false ) {
				convertedData.inactivePanels.push( panelName );
			}

			if ( panel?.opened === true ) {
				convertedData.openPanels.push( panelName );
			}

			return convertedData;
		},
		{ inactivePanels: [], openPanels: [] }
	);
}

export function migrateThirdPartyFeaturePreferencesToPreferencesStore(
	persistence
) {
	const interfaceStoreName = 'core/interface';
	const preferencesStoreName = 'core/preferences';

	let state = persistence.get();

	const interfaceScopes = state[ interfaceStoreName ]?.preferences?.features;

	for ( const scope in interfaceScopes ) {
		// Don't migrate any core 'scopes'.
		if ( scope.startsWith( 'core' ) ) {
			continue;
		}

		// Skip this scope if there are no features to migrate.
		const featuresToMigrate = interfaceScopes[ scope ];
		if ( ! featuresToMigrate ) {
			continue;
		}

		const existingPreferences = state[ preferencesStoreName ]?.preferences;

		// Add the data to the preferences store structure.
		persistence.set( preferencesStoreName, {
			preferences: {
				...existingPreferences,
				[ scope ]: featuresToMigrate,
			},
		} );

		// Remove the data from the interface store structure.
		// Call `persistence.get` again to make sure `state` is up-to-date with
		// any changes from the previous iteration of this loop.
		state = persistence.get();
		const otherInterfaceState = state[ interfaceStoreName ];
		const otherInterfaceScopes =
			state[ interfaceStoreName ]?.preferences?.features;

		persistence.set( interfaceStoreName, {
			...otherInterfaceState,
			preferences: {
				features: {
					...otherInterfaceScopes,
					[ scope ]: undefined,
				},
			},
		} );
	}
}

/**
 * Migrates interface 'enableItems' data to the preferences store.
 *
 * The interface package stores this data in this format:
 * ```js
 * {
 *     enableItems: {
 *         singleEnableItems: {
 * 	           complementaryArea: {
 *                 'core/edit-post': 'edit-post/document',
 *                 'core/edit-site': 'edit-site/global-styles',
 *             }
 *         },
 *         multipleEnableItems: {
 *             pinnedItems: {
 *                 'core/edit-post': {
 *                     'plugin-1': true,
 *                 },
 *                 'core/edit-site': {
 *                     'plugin-2': true,
 *                 },
 *             },
 *         }
 *     }
 * }
 * ```
 * and it should be migrated it to:
 * ```js
 * {
 *     'core/edit-post': {
 *         complementaryArea: 'edit-post/document',
 *         pinnedItems: {
 *             'plugin-1': true,
 *         },
 *     },
 *     'core/edit-site': {
 *         complementaryArea: 'edit-site/global-styles',
 *         pinnedItems: {
 *             'plugin-2': true,
 *         },
 *     },
 * }
 * ```
 *
 * @param {Object} persistence The persistence interface.
 */
export function migrateInterfaceEnableItemsToPreferencesStore( persistence ) {
	const interfaceStoreName = 'core/interface';
	const preferencesStoreName = 'core/preferences';
	const state = persistence.get();
	const sourceEnableItems = state[ interfaceStoreName ]?.enableItems;

	// There's nothing to migrate, exit early.
	if ( ! sourceEnableItems ) {
		return;
	}

	const allPreferences = state[ preferencesStoreName ]?.preferences ?? {};

	// First convert complementaryAreas into the right format.
	// Use the existing preferences as the accumulator so that the data is
	// merged.
	const sourceComplementaryAreas =
		sourceEnableItems?.singleEnableItems?.complementaryArea ?? {};

	const convertedComplementaryAreas = Object.keys(
		sourceComplementaryAreas
	).reduce( ( accumulator, scope ) => {
		const data = sourceComplementaryAreas[ scope ];

		// Don't overwrite any existing data in the preferences store.
		if ( accumulator[ scope ]?.complementaryArea ) {
			return accumulator;
		}

		return {
			...accumulator,
			[ scope ]: {
				...accumulator[ scope ],
				complementaryArea: data,
			},
		};
	}, allPreferences );

	// Next feed the converted complementary areas back into a reducer that
	// converts the pinned items, resulting in the fully migrated data.
	const sourcePinnedItems =
		sourceEnableItems?.multipleEnableItems?.pinnedItems ?? {};
	const allConvertedData = Object.keys( sourcePinnedItems ).reduce(
		( accumulator, scope ) => {
			const data = sourcePinnedItems[ scope ];
			// Don't overwrite any existing data in the preferences store.
			if ( accumulator[ scope ]?.pinnedItems ) {
				return accumulator;
			}

			return {
				...accumulator,
				[ scope ]: {
					...accumulator[ scope ],
					pinnedItems: data,
				},
			};
		},
		convertedComplementaryAreas
	);

	persistence.set( preferencesStoreName, {
		preferences: allConvertedData,
	} );

	// Remove migrated preferences.
	const otherInterfaceItems = state[ interfaceStoreName ];
	persistence.set( interfaceStoreName, {
		...otherInterfaceItems,
		enableItems: undefined,
	} );
}

persistencePlugin.__unstableMigrate = ( pluginOptions ) => {
	const persistence = createPersistenceInterface( pluginOptions );

	// Boolean feature preferences.
	migrateFeaturePreferencesToPreferencesStore(
		persistence,
		'core/edit-widgets'
	);
	migrateFeaturePreferencesToPreferencesStore(
		persistence,
		'core/customize-widgets'
	);
	migrateFeaturePreferencesToPreferencesStore(
		persistence,
		'core/edit-post'
	);
	migrateFeaturePreferencesToPreferencesStore(
		persistence,
		'core/edit-site'
	);
	migrateThirdPartyFeaturePreferencesToPreferencesStore( persistence );

	// Other ad-hoc preferences.
	migrateIndividualPreferenceToPreferencesStore(
		persistence,
		{ from: 'core/edit-post', scope: 'core/edit-post' },
		'hiddenBlockTypes'
	);
	migrateIndividualPreferenceToPreferencesStore(
		persistence,
		{ from: 'core/edit-post', scope: 'core/edit-post' },
		'editorMode'
	);
	migrateIndividualPreferenceToPreferencesStore(
		persistence,
		{ from: 'core/edit-post', scope: 'core/edit-post' },
		'preferredStyleVariations'
	);
	migrateIndividualPreferenceToPreferencesStore(
		persistence,
		{ from: 'core/edit-post', scope: 'core/edit-post' },
		'panels',
		convertEditPostPanels
	);
	migrateIndividualPreferenceToPreferencesStore(
		persistence,
		{ from: 'core/editor', scope: 'core/edit-post' },
		'isPublishSidebarEnabled'
	);
	migrateIndividualPreferenceToPreferencesStore(
		persistence,
		{ from: 'core/edit-site', scope: 'core/edit-site' },
		'editorMode'
	);
	migrateInterfaceEnableItemsToPreferencesStore( persistence );
};

export default persistencePlugin;
