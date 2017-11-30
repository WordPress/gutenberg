/**
 * External dependencies
 */
import { createStore as createReduxStore } from 'redux';

/**
 * WordPress Dependencies
 */
import { registerReducer, registerSelectors, withRehydratation, loadAndPersist } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import enhanceWithBrowserSize from './mobile';
import applyMiddlewares from './middlewares';
import { BREAK_MEDIUM } from './constants';
import {
	getCurrentPostType,
	getEditedPostContent,
	getEditedPostTitle,
	getSelectedBlockCount,
	getCurrentPostSlug,
} from './selectors';

/**
 * Module Constants
 */
const STORAGE_KEY = `GUTENBERG_PREFERENCES_${ window.userSettings.uid }`;
const MODULE_KEY = 'core/editor';

/**
 * Creates a Redux store for editor state, enhanced with middlewares, persistence,
 * and browser size observer.
 *
 * @return {Object} Redux store
 */
export function createStore() {
	const store = applyMiddlewares( createReduxStore( withRehydratation( reducer, 'preferences', STORAGE_KEY ) ) );
	loadAndPersist( store, reducer, 'preferences', STORAGE_KEY );
	enhanceWithBrowserSize( store, BREAK_MEDIUM );

	return store;
}

/**
 * Registers an editor state store, enhanced with middlewares, persistence, and
 * browser size observer.
 *
 * @return {Object} Registered data store
 */
export function createRegisteredStore() {
	const store = applyMiddlewares(
		registerReducer( 'core/editor', withRehydratation( reducer, 'preferences', STORAGE_KEY ) )
	);
	loadAndPersist( store, reducer, 'preferences', STORAGE_KEY );
	enhanceWithBrowserSize( store, BREAK_MEDIUM );

	return store;
}

registerSelectors( MODULE_KEY, {
	getCurrentPostType,
	getEditedPostContent,
	getEditedPostTitle,
	getSelectedBlockCount,
	getCurrentPostSlug,
} );

export default createRegisteredStore();
