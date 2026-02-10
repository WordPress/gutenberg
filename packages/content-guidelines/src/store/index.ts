/**
 * WordPress dependencies
 */
import { createReduxStore, register } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import {
	fetchGuidelines,
	saveGuidelines,
	updateCategory,
	setStatus,
	resetChanges,
	resetStore,
	fetchRevisions,
	restoreRevision,
} from './actions';
import * as selectors from './selectors';
import { STORE_NAME } from './constants';
import type { State } from './constants';

/**
 * Action creators for the store (excluding action type constants).
 */
const actions = {
	fetchGuidelines,
	saveGuidelines,
	updateCategory,
	setStatus,
	resetChanges,
	resetStore,
	fetchRevisions,
	restoreRevision,
};

/**
 * Store definition for the content guidelines namespace.
 */
export const store = createReduxStore<
	State,
	typeof actions,
	typeof selectors
>( STORE_NAME, {
	reducer,
	actions,
	selectors,
} );

register( store );
