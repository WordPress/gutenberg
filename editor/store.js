/**
 * External dependencies
 */
import { applyMiddleware, createStore } from 'redux';
import refx from 'refx';
import multi from 'redux-multi';
import { flowRight } from 'lodash';

/**
 * Internal dependencies
 */
import effects from './effects';
import reducer from './reducer';
import { getPreferences } from './selectors';

/**
 * Module constants
 */
const GUTENBERG_PREFERENCES_KEY = 'GUTENBERG_PREFERENCES';

/**
 * Loads the initial preferences and saves them to the local storage once changed
 * @param {Object} store Redux Store
 */
function setupStorePersistence( store ) {
	// Load initial preferences
	const userPreferencesString = window.localStorage.getItem( GUTENBERG_PREFERENCES_KEY );
	if ( userPreferencesString ) {
		const preferences = JSON.parse( userPreferencesString );
		store.dispatch( {
			type: 'UPDATE_PREFERENCES',
			preferences,
		} );
	}

	// Persist updated preferences
	let currentPreferences = getPreferences( store.getState() );
	store.subscribe( () => {
		const newPreferences = getPreferences( store.getState() );
		if ( newPreferences !== currentPreferences ) {
			currentPreferences = newPreferences;
			window.localStorage.setItem( GUTENBERG_PREFERENCES_KEY, JSON.stringify( currentPreferences ) );
		}
	} );
}

/**
 * Creates a new instance of a Redux store.
 *
 * @return {Redux.Store} Redux store
 */
function createReduxStore() {
	const enhancers = [ applyMiddleware( multi, refx( effects ) ) ];
	if ( window.__REDUX_DEVTOOLS_EXTENSION__ ) {
		enhancers.push( window.__REDUX_DEVTOOLS_EXTENSION__() );
	}

	const store = createStore( reducer, flowRight( enhancers ) );
	setupStorePersistence( store );

	return store;
}

export default createReduxStore;
