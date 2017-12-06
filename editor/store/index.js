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
import enhanceWithBrowserSize from './browser';
import store from './store';

/**
 * Module Constants
 */
const STORAGE_KEY = `GUTENBERG_PREFERENCES_${ window.userSettings.uid }`;

registerReducer( 'core/editor', withRehydratation( reducer, 'preferences' ) );
loadAndPersist( 'core/editor.preferences', STORAGE_KEY, PREFERENCES_DEFAULTS );
enhanceWithBrowserSize( store );

export default store;
