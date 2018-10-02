/**
 * External dependencies
 */
import { createStore as createReduxStore } from 'redux';
import {
	flowRight,
} from 'lodash';

/**
 * Creates a namespace object with a store derived from the reducer given.
 *
 * @param {Object} reducer Reducer function.
 * @param {Array} enhancers Array of enhancer functions to be added to the store.
 * @param {function} globalListener TODO: Remove this after subscribe is passed correctly.
 *
 * @return {Object} Store Object.
 */
export function createNamespace( reducer, enhancers, globalListener ) {
	const store = createReduxStore( reducer, flowRight( enhancers ) );
	const namespace = { store, reducer };

	// TODO: Move this to a subscribe function instead of referencing globalListener.
	// Customize subscribe behavior to call listeners only on effective change,
	// not on every dispatch.
	let lastState = store.getState();
	store.subscribe( () => {
		const state = store.getState();
		const hasChanged = state !== lastState;
		lastState = state;

		if ( hasChanged ) {
			globalListener();
		}
	} );

	return namespace;
}
