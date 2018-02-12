/**
 * WordPress Dependencies
 */
import { registerReducer, registerSelectors, withRehydratation, loadAndPersist } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import applyMiddlewares from './middlewares';
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

const store = applyMiddlewares(
	registerReducer( MODULE_KEY, withRehydratation( reducer, 'preferences', STORAGE_KEY ) )
);
loadAndPersist( store, reducer, 'preferences', STORAGE_KEY );

registerSelectors( MODULE_KEY, {
	getCurrentPostType,
	getEditedPostContent,
	getEditedPostTitle,
	getSelectedBlockCount,
	getCurrentPostSlug,
} );

export default store;
