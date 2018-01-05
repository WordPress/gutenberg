/**
 * WordPress Dependencies
 */
import { registerReducer } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { PREFERENCES_DEFAULTS } from './defaults';
import reducer from './reducer';
import { withRehydratation, loadAndPersist } from './persist';
import enhanceWithBrowserSize from './mobile';
import applyMiddlewares from './middlewares';
import { BREAK_MEDIUM } from './constants';

/**
 * Module Constants
 */
const STORAGE_KEY = `GUTENBERG_PREFERENCES_${ window.userSettings.uid }`;

const store = applyMiddlewares(
	registerReducer( 'core/editor', withRehydratation( reducer, 'preferences' ) )
);
loadAndPersist( store, 'preferences', STORAGE_KEY, PREFERENCES_DEFAULTS );
enhanceWithBrowserSize( store, BREAK_MEDIUM );

export default store;
