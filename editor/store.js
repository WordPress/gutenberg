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
import storePersist from './store-persist';

/**
 * Module constants
 */
const GUTENBERG_PREFERENCES_KEY = `GUTENBERG_PREFERENCES_${ window.userSettings.uid }`;

/**
 * Creates a new instance of a Redux store.
 *
 * @return {Redux.Store} Redux store
 */
function createReduxStore() {
	const enhancers = [
		applyMiddleware( multi, refx( effects ) ),
		storePersist( 'preferences', GUTENBERG_PREFERENCES_KEY ),
	];

	if ( window.__REDUX_DEVTOOLS_EXTENSION__ ) {
		enhancers.push( window.__REDUX_DEVTOOLS_EXTENSION__() );
	}

	const store = createStore( reducer, flowRight( enhancers ) );

	return store;
}

export default createReduxStore;
