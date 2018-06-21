/**
 * WordPress Dependencies
 */
import {
	registerReducer,
	registerSelectors,
	registerActions,
	withRehydration,
	loadAndPersist,
} from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import applyMiddlewares from './middlewares';
import * as selectors from './selectors';
import * as actions from './actions';

/**
 * Module Constants
 */
const STORAGE_KEY = `GUTENBERG_PREFERENCES_${ window.userSettings.uid }`;
const REDUCER_KEY = 'core/editor';

function createEditorStore( reducerKey = REDUCER_KEY ) {
	const store = applyMiddlewares(
		registerReducer( reducerKey, withRehydration( reducer, 'preferences', STORAGE_KEY ) )
	);
	loadAndPersist( store, reducer, 'preferences', STORAGE_KEY );

	registerSelectors( reducerKey, selectors );
	registerActions( reducerKey, actions );

	return store;
}

export default createEditorStore;
