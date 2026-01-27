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
	fetchRevisions,
	restoreRevision,
} from './actions';
import * as selectors from './selectors';
import { STORE_NAME } from './constants';

/**
 * Action creators for the store (excluding action type constants).
 */
const actions = {
	fetchGuidelines,
	saveGuidelines,
	updateCategory,
	setStatus,
	resetChanges,
	fetchRevisions,
	restoreRevision,
};

/**
 * Store definition for the content guidelines namespace.
 */
export const store = createReduxStore( STORE_NAME, {
	reducer,
	actions,
	selectors,
} );

register( store );
