/**
 * External dependencies
 */
import isEqualShallow from 'is-equal-shallow';
import { createStore } from 'redux';
import { flowRight, without, mapValues } from 'lodash';

/**
 * WordPress dependencies
 */
import { deprecated } from '@wordpress/utils';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
export { loadAndPersist, withRehydratation } from './persist';

/**
 * Module constants
 */
const stores = {};
const selectors = {};
const actions = {};
let listeners = [];

/**
 * Global listener called for each store's update.
 */
export function globalListener() {
	listeners.forEach( listener => listener() );
}

/**
 * Registers a new sub-reducer to the global state and returns a Redux-like store object.
 *
 * @param {string} reducerKey Reducer key.
 * @param {Object} reducer    Reducer function.
 *
 * @return {Object} Store Object.
 */
export function registerReducer( reducerKey, reducer ) {
	const enhancers = [];
	if ( window.__REDUX_DEVTOOLS_EXTENSION__ ) {
		enhancers.push( window.__REDUX_DEVTOOLS_EXTENSION__( { name: reducerKey, instanceId: reducerKey } ) );
	}
	const store = createStore( reducer, flowRight( enhancers ) );
	stores[ reducerKey ] = store;
	store.subscribe( globalListener );

	return store;
}

/**
 * Registers selectors for external usage.
 *
 * @param {string} reducerKey   Part of the state shape to register the
 *                              selectors for.
 * @param {Object} newSelectors Selectors to register. Keys will be used as the
 *                              public facing API. Selectors will get passed the
 *                              state as first argument.
 */
export function registerSelectors( reducerKey, newSelectors ) {
	const store = stores[ reducerKey ];
	const createStateSelector = ( selector ) => ( ...args ) => selector( store.getState(), ...args );
	selectors[ reducerKey ] = mapValues( newSelectors, createStateSelector );
}

/**
 * Registers actions for external usage.
 *
 * @param {string} reducerKey   Part of the state shape to register the
 *                              selectors for.
 * @param {Object} newActions   Actions to register.
 */
export function registerActions( reducerKey, newActions ) {
	const store = stores[ reducerKey ];
	const createBoundAction = ( action ) => ( ...args ) => store.dispatch( action( ...args ) );
	actions[ reducerKey ] = mapValues( newActions, createBoundAction );
}

/**
 * Subscribe to changes to any data.
 *
 * @param {Function}   listener Listener function.
 *
 * @return {Function}           Unsubscribe function.
 */
export const subscribe = ( listener ) => {
	listeners.push( listener );

	return () => {
		listeners = without( listeners, listener );
	};
};

/**
 * Calls a selector given the current state and extra arguments.
 *
 * @param {string} reducerKey Part of the state shape to register the
 *                            selectors for.
 *
 * @return {*} The selector's returned value.
 */
export function select( reducerKey ) {
	if ( arguments.length > 1 ) {
		deprecated( 'Calling select with multiple arguments', {
			version: '2.4',
			plugin: 'Gutenberg',
		} );

		const [ , selectorKey, ...args ] = arguments;
		return select( reducerKey )[ selectorKey ]( ...args );
	}

	return selectors[ reducerKey ];
}

/**
 * Returns the available actions for a part of the state.
 *
 * @param {string} reducerKey Part of the state shape to dispatch the
 *                            action for.
 *
 * @return {*} The action's returned value.
 */
export function dispatch( reducerKey ) {
	return actions[ reducerKey ];
}

/**
 * Higher Order Component used to inject data and actions using the registered selectors/actions.
 *
 * @param {Function} mapDataToProps Gets called with the props object
 *                                  to determine the data for the
 *                                  component.
 *
 * @return {Function} Renders the wrapped component and passes it data.
 */
export const onSubscribe = ( mapDataToProps ) => ( WrappedComponent ) => {
	const usePropsArgument = mapDataToProps.length !== 0;

	class ComponentWithData extends Component {
		constructor() {
			super( ...arguments );
			this.state = {};
		}

		componentWillMount() {
			this.subscribe();
			this.runSelection( this.props );
		}

		componentWillUnmount() {
			this.unsubscribe();
		}

		componentWillReceiveProps( newProps ) {
			if ( usePropsArgument ) {
				this.runSelection( newProps );
			}
		}

		subscribe() {
			this.unsubscribe = subscribe( () => this.runSelection( this.props ) );
		}

		runSelection( props ) {
			const newState = mapDataToProps( props );
			if ( ! isEqualShallow( newState, this.state ) ) {
				this.setState( newState );
			}
		}

		shouldComponentUpdate( nextProps, nextState ) {
			return nextState !== this.state || ! isEqualShallow( nextProps, this.props );
		}

		render() {
			return (
				<WrappedComponent { ...this.props } { ...this.state } />
			);
		}
	}

	return ComponentWithData;
};

export const query = ( mapSelectToProps ) => {
	deprecated( 'wp.data.query', {
		version: '2.5',
		alternative: 'wp.data.onSubscribe',
		plugin: 'Gutenberg',
	} );

	return onSubscribe( ( props ) => {
		return mapSelectToProps( select, props );
	} );
};
