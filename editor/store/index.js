/**
 * WordPress Dependencies
 */
import { registerReducer, withRehydratation, loadAndPersist } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { PREFERENCES_DEFAULTS } from './defaults';
import reducer from './reducer';
import enhanceWithBrowserSize from './browser';
import applyMiddlewares from './middlewares';

/**
 * Module Constants
 */
const STORAGE_KEY = `GUTENBERG_PREFERENCES_${ window.userSettings.uid }`;
const REDUCER_KEY = 'preferences';

const store = applyMiddlewares(
	registerReducer( 'core/editor', withRehydratation( reducer, REDUCER_KEY, STORAGE_KEY ) )
);
loadAndPersist( store, REDUCER_KEY, STORAGE_KEY, PREFERENCES_DEFAULTS );
enhanceWithBrowserSize( store );

export default store;
