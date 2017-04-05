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
 * Reducer returning editor blocks state, an combined reducer of keys byUid,
 * order, selected, hovered, where blocks are parsed from current HTML markup.
 *
 * @param  {Object} state  Current state
 * @param  {Object} action Dispatched action
 * @return {Object}        Updated state
 */
export const blocks = ( () => {
	const reducer = combineReducers( {
		byUid( state = {}, action ) {
			switch ( action.type ) {
				case 'SET_HTML':
					return keyBy( action.blockNodes, 'uid' );

				case 'UPDATE_BLOCK':
					return {
						...state,
						[ action.uid ]: {
							...state[ action.uid ],
							...action.updates
						}
					};
			}

			return state;
		},
		order( state = [], action ) {
			switch ( action.type ) {
				case 'SET_HTML':
					return action.blockNodes.map( ( { uid } ) => uid );
			}

			return state;
		},
		selected( state = {}, action ) {
			switch ( action.type ) {
				case 'TOGGLE_BLOCK_SELECTED':
					return {
						...state,
						[ action.uid ]: action.selected
					};
			}

			return state;
		},
		hovered( state = {}, action ) {
			switch ( action.type ) {
				case 'TOGGLE_BLOCK_HOVERED':
					return {
						...state,
						[ action.uid ]: action.hovered
					};

				case 'TOGGLE_BLOCK_SELECTED':
					if ( state[ action.uid ] ) {
						return {
							...state,
							[ action.uid ]: false
						};
					}
					break;
			}

			return state;
		}
	} );

	return ( state, action ) => {
		if ( 'SET_HTML' === action.type ) {
			action = {
				...action,
				blockNodes: wp.blocks.parse( action.html )
			};
		}

		return reducer( state, action );
	};
} )();

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
