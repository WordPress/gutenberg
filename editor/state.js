/**
 * External dependencies
 */
import { combineReducers, createStore } from 'redux';
import { keyBy, last, omit, without } from 'lodash';

/**
 * Internal dependencies
 */
import { combineUndoableReducers } from 'utils/undoable-reducer';

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

			case 'SWITCH_BLOCK_TYPE':
				return {
					...state,
					[ action.uid ]: action.block
				};

			case 'REMOVE_BLOCK':
				return omit( state, action.uid );
		}

		return state;
	},
	order( state = [], action ) {
		let index;
		let swappedUid;
		switch ( action.type ) {
			case 'REPLACE_BLOCKS':
				return action.blockNodes.map( ( { uid } ) => uid );

			case 'INSERT_BLOCK':
				const position = action.after ? state.indexOf( action.after ) + 1 : state.length;
				return [
					...state.slice( 0, position ),
					action.block.uid,
					...state.slice( position )
				];

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

			case 'REMOVE_BLOCK':
				return without( state, action.uid );
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
export function selectedBlock( state = {}, action ) {
	switch ( action.type ) {
		case 'TOGGLE_BLOCK_SELECTED':
			if ( ! action.selected ) {
				return state.uid === action.uid ? {} : state;
			}
			return action.uid === state.uid
				? state
				: { uid: action.uid, typing: false, focus: {} };

		case 'MOVE_BLOCK_UP':
		case 'MOVE_BLOCK_DOWN':
			return action.uid === state.uid
				? state
				: { uid: action.uid, typing: false, focus: {} };

		case 'INSERT_BLOCK':
			return {
				uid: action.block.uid,
				typing: false,
				focus: {}
			};

		case 'UPDATE_FOCUS':
			return {
				uid: action.uid,
				typing: state.uid === action.uid ? state.typing : false,
				focus: action.config || {}
			};

		case 'START_TYPING':
			if ( action.uid !== state.uid ) {
				return {
					uid: action.uid,
					typing: true,
					focus: {}
				};
			}

			return {
				...state,
				typing: true
			};
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
		case 'START_TYPING':
			return null;
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

export function isSidebarOpened( state = false, action ) {
	switch ( action.type ) {
		case 'TOGGLE_SIDEBAR':
			return ! state;
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
		mode,
		isSidebarOpened
	} );

	return createStore(
		reducer,
		window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
	);
}

export default createReduxStore;
