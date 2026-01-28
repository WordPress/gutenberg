/**
 * WordPress dependencies
 */
import { createReduxStore, register, select, dispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as actions from './actions';
import * as selectors from './selectors';
import * as resolvers from './resolvers';

/**
 * Store name for backward compatibility.
 * UI state (test results, etc.) is still managed here.
 * Guidelines data is now managed by core-data.
 */
export const STORE_NAME = 'content-guidelines';

/**
 * Entity kind and name for core-data.
 * Use these constants when calling core-data hooks.
 */
export const ENTITY_KIND = 'root';
export const ENTITY_NAME = 'contentGuidelines';
export const ENTITY_ID = 'current';

/**
 * Entity configuration for core-data integration.
 * This is the canonical pattern used by Global Styles.
 */
const GUIDELINES_ENTITY = {
	kind: ENTITY_KIND,
	name: ENTITY_NAME,
	label: 'Content Guidelines',
	baseURL: '/wp/v2/content-guidelines',
	baseURLParams: { context: 'edit' },
	key: 'id',
	getTitle: () => 'Content Guidelines',
};

/**
 * Store configuration for UI-only state.
 * Guidelines data is managed by core-data, not this store.
 */
const storeConfig = {
	reducer,
	actions,
	selectors,
	resolvers,
};

/**
 * Create and register the store for UI state.
 */
export const store = createReduxStore( STORE_NAME, storeConfig );

// Only register if not already registered.
try {
	const existingStore = select( STORE_NAME );
	if ( ! existingStore ) {
		register( store );
	}
} catch ( e ) {
	register( store );
}

/**
 * Register the content guidelines entity with core-data.
 * This enables:
 * - Automatic dirty tracking via hasEditsForEntityRecord
 * - SaveHub integration via __experimentalGetDirtyEntityRecords
 * - Standard save flow via saveEditedEntityRecord
 */
function registerEntity() {
	try {
		const coreDataDispatch = dispatch( coreStore );
		const coreDataSelect = select( coreStore );

		// Check if entity is already registered
		const existingConfig = coreDataSelect.getEntityConfig(
			ENTITY_KIND,
			ENTITY_NAME
		);

		if ( ! existingConfig ) {
			coreDataDispatch.addEntities( [ GUIDELINES_ENTITY ] );
		}
	} catch ( e ) {
		// Core-data not available yet, will be registered on first use
	}
}

// Register entity immediately and after a delay (to handle race conditions)
if ( typeof window !== 'undefined' ) {
	registerEntity();
	setTimeout( registerEntity, 100 );
}

export default store;
