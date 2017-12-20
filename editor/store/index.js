/**
 * WordPress Dependencies
 */
import { registerReducer, registerSelectors } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { PREFERENCES_DEFAULTS } from './defaults';
import reducer from './reducer';
import { withRehydratation, loadAndPersist } from './persist';
import enhanceWithBrowserSize from './browser';
import store from './store';
import { getEditedPostTitle } from './selectors';

/**
 * Module Constants
 */
const STORAGE_KEY = `GUTENBERG_PREFERENCES_${ window.userSettings.uid }`;
const MODULE_KEY = 'core/editor';

registerReducer( MODULE_KEY, withRehydratation( reducer, 'preferences' ) );
loadAndPersist( store, 'preferences', STORAGE_KEY, PREFERENCES_DEFAULTS );
enhanceWithBrowserSize( store );

registerSelectors( MODULE_KEY, { getEditedPostTitle } );

export default store;
