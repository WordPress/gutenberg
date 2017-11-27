/**
 * External dependencies
 */
import { createStore } from 'redux';
import { flowRight } from 'lodash';

/**
 * WordPress dependencies
 */
import { storePersist } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import { PREFERENCES_DEFAULTS } from './defaults';

/**
 * Module constants
 */
const GUTENBERG_PREFERENCES_KEY = `GUTENBERG_PREFERENCES_EDIT_POST_${ window.userSettings.uid }`;

/**
 * Creates a new instance of a Redux store.
 *
 * @param  {?*}          preloadedState Optional initial state
 * @return {Redux.Store}                Redux store
 */
function createReduxStore() {
	const enhancers = [
		storePersist( {
			reducerKey: 'preferences',
			storageKey: GUTENBERG_PREFERENCES_KEY,
			defaults: PREFERENCES_DEFAULTS,
		} ),
	];

	const store = createStore( reducer, {}, flowRight( enhancers ) );

	return store;
}

export default createReduxStore;
