/**
 * External dependencies
 */
import { combineReducers, createStore } from 'redux';
import { includes, keyBy, last } from 'lodash';

/**
 * Reducer enhancer which transforms the result of the original reducer into an
 * object tracking its own history (past, present, future).
 *
 * @param  {Function} reducer            Original reducer
 * @param  {?Object}  options            Optional options
 * @param  {?Number}  options.limit      Maximum length of past history
 * @param  {?Array}   options.resetTypes Action types upon which to clear past
 * @return {Function}                    Enhanced reducer
 */
export function undoable( reducer, options ) {
	const initialState = {
		past: [],
		present: reducer( undefined, {} ),
		future: []
	};

	options = {
		limit: 10,
		...options
	};

	return ( state = initialState, action ) => {
		const { past, present, future } = state;

		switch ( action.type ) {
			case 'UNDO':
				return {
					past: past.slice( 0, past.length - 1 ),
					present: past[ past.length - 1 ],
					future: [ present, ...future ]
				};

			case 'REDO':
				return {
					past: [ ...past, present ],
					present: future[ 0 ],
					future: future.slice( 1 )
				};
		}

		const nextPresent = reducer( present, action );

		if ( includes( options.resetTypes, action.type ) ) {
			return {
				past: [],
				present: nextPresent,
				future: []
			};
		}

		if ( present === nextPresent ) {
			return state;
		}

		return {
			past: [ ...past, present ].slice( -1 * options.limit ),
			present: nextPresent,
			future: []
		};
	};
}

/**
 * A wrapper for combineReducers which applies an undo history to the combined
 * reducer. As a convenience, properties of the reducers object are accessible
 * via object getters, with history assigned to a nested history property.
 *
 * @see undoable
 *
 * @param  {Object}   reducers Object of reducers
 * @param  {?Object}  options  Optional options
 * @return {Function}          Combined reducer
 */
export function combineUndoableReducers( reducers, options ) {
	const reducer = undoable( combineReducers( reducers ), options );

	function withGetters( history ) {
		const state = { history };
		const keys = Object.getOwnPropertyNames( history.present );
		const getters = keys.reduce( ( memo, key ) => {
			memo[ key ] = {
				get: function() {
					return this.history.present[ key ];
				}
			};

			return memo;
		}, {} );
		Object.defineProperties( state, getters );

		return state;
	}

	const initialState = withGetters( reducer( undefined, {} ) );

	return ( state = initialState, action ) => {
		const nextState = reducer( state.history, action );
		if ( nextState === state.history.present ) {
			return state;
		}

		return withGetters( nextState );
	};
}

/**
 * Reducer returning editor blocks state, an combined reducer of keys byUid,
 * order, where blocks are parsed from current HTML markup.
 *
 * @param  {Object} state  Current state
 * @param  {Object} action Dispatched action
 * @return {Object}        Updated state
 */
export const blocks = combineUndoableReducers( {
	byUid( state = {}, action ) {
		switch ( action.type ) {
			case 'REPLACE_BLOCKS':
				return keyBy( action.blockNodes, 'uid' );

			case 'UPDATE_BLOCK':
				return {
					...state,
					[ action.uid ]: {
						...state[ action.uid ],
						...action.updates
					}
				};

			case 'INSERT_BLOCK':
				return {
					...state,
					[ action.block.uid ]: action.block
				};
		}

		return state;
	},
	order( state = [], action ) {
		let index;
		let swappedUid;
		switch ( action.type ) {
			case 'REPLACE_BLOCKS':
				return action.blockNodes.map( ( { uid } ) => uid );

			case 'MOVE_BLOCK_UP':
				if ( action.uid === state[ 0 ] ) {
					return state;
				}
				index = state.indexOf( action.uid );
				swappedUid = state[ index - 1 ];
				return [
					...state.slice( 0, index - 1 ),
					action.uid,
					swappedUid,
					...state.slice( index + 1 )
				];

			case 'MOVE_BLOCK_DOWN':
				if ( action.uid === last( state ) ) {
					return state;
				}
				index = state.indexOf( action.uid );
				swappedUid = state[ index + 1 ];
				return [
					...state.slice( 0, index ),
					swappedUid,
					action.uid,
					...state.slice( index + 2 )
				];

			case 'INSERT_BLOCK':
				return [
					...state,
					action.block.uid
				];
		}

		return state;
	}
}, { resetTypes: [ 'REPLACE_BLOCKS' ] } );

/**
 * Reducer returning selected block state.
 *
 * @param  {Object} state  Current state
 * @param  {Object} action Dispatched action
 * @return {Object}        Updated state
 */
export function selectedBlock( state = null, action ) {
	switch ( action.type ) {
		case 'TOGGLE_BLOCK_SELECTED':
			return action.selected ? action.uid : null;

		case 'MOVE_BLOCK_UP':
		case 'MOVE_BLOCK_DOWN':
			return action.uid;

		case 'INSERT_BLOCK':
			return action.block.uid;
	}

	return state;
}

/**
 * Reducer returning hovered block state.
 *
 * @param  {Object} state  Current state
 * @param  {Object} action Dispatched action
 * @return {Object}        Updated state
 */
export function hoveredBlock( state = null, action ) {
	switch ( action.type ) {
		case 'TOGGLE_BLOCK_HOVERED':
			return action.hovered ? action.uid : null;

		case 'TOGGLE_BLOCK_SELECTED':
			if ( action.selected ) {
				return null;
			}
			break;
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
		blocks,
		selectedBlock,
		hoveredBlock,
		mode
	} );

	return createStore(
		reducer,
		window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
	);
}

export default createReduxStore;
