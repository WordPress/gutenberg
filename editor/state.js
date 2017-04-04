/**
 * External dependencies
 */
import { combineReducers, createStore } from 'redux';
import { keyBy } from 'lodash';

/**
 * Reducer returning editor HTML state, representing the markup source of the
 * current post.
 *
 * @param  {?string} state  Current state
 * @param  {Object}  action Dispatched action
 * @return {?string}        Updated state
 */
export function html( state = null, action ) {
	switch ( action.type ) {
		case 'SET_HTML':
			return action.html;
	}

	return state;
}

/**
 * Reducer returning editor blocks state, an object with keys byUid and order,
 * where blocks are parsed from current HTML markup.
 *
 * @param  {Object} state  Current state
 * @param  {Object} action Dispatched action
 * @return {Object}        Updated state
 */
export function blocks( state, action ) {
	if ( undefined === state ) {
		state = {
			byUid: {},
			order: []
		};
	}

	switch ( action.type ) {
		case 'SET_HTML':
			const blockNodes = wp.blocks.parse( action.html );
			return {
				byUid: keyBy( blockNodes, 'uid' ),
				order: blockNodes.map( ( { uid } ) => uid )
			};

		case 'UPDATE_BLOCK':
			return {
				...state,
				byUid: {
					...state.byUid,
					[ action.uid ]: {
						...state.byUid[ action.uid ],
						...action.updates
					}
				}
			};
	}

	return state;
}

/**
 * Reducer returning current editor mode, either "visual" or "text".
 *
 * @param  {string} state  Current state
 * @param  {Object} action Dispatched action
 * @return {string}        Updated state
 */
export function mode( state = 'visual', action ) {
	switch ( action.type ) {
		case 'SWITCH_MODE':
			return action.mode;
	}

	return state;
}

/**
 * Creates a new instance of a Redux store.
 *
 * @return {Redux.Store} Redux store
 */
export function createReduxStore() {
	const reducer = combineReducers( {
		html,
		blocks,
		mode
	} );

	return createStore(
		reducer,
		window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
	);
}

export default createReduxStore;
