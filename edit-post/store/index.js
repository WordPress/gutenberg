/**
 * WordPress Dependencies
 */
import { registerReducer, withRehydratation, loadAndPersist } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import enhanceWithBrowserSize from './mobile';
import applyMiddlewares from './middlewares';
import { BREAK_MEDIUM } from './constants';

/**
 * Module Constants
 */
const STORAGE_KEY = `WP_EDIT_POST_PREFERENCES_${ window.userSettings.uid }`;
const MODULE_KEY = 'core/edit-post';

const store = applyMiddlewares(
	registerReducer( MODULE_KEY, withRehydratation( reducer, 'preferences', STORAGE_KEY ) )
);
loadAndPersist( store, reducer, 'preferences', STORAGE_KEY );
enhanceWithBrowserSize( store, BREAK_MEDIUM );

export default store;
