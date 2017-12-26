/**
 * WordPress Dependencies
 */
import { registerReducer, withRehydratation, loadAndPersist } from '@wordpress/data';

/**
 * Internal dependencies
 */
import DEFAULTS from './defaults';
import reducer from './reducer';

/**
 * Module Constants
 */
const STORAGE_KEY = `GUTENBERG_NUX_${ window.userSettings.uid }`;
const REDUCER_KEY = 'nux';

const store = registerReducer( 'core/nux', withRehydratation( reducer, REDUCER_KEY, STORAGE_KEY ) );
loadAndPersist( store, REDUCER_KEY, STORAGE_KEY, DEFAULTS );

export default store;
