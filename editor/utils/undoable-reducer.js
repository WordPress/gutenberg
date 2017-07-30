/**
 * External dependencies
 */
import { combineReducers } from 'redux';
import { includes } from 'lodash';

/**
 * Reducer enhancer which transforms the result of the original reducer into an
 * object tracking its own history (past, present, future).
 *
 * @param  {Function} reducer            Original reducer
 * @param  {?Object}  options            Optional options
 * @param  {?Array}   options.resetTypes Action types upon which to clear past
 * @return {Function}                    Enhanced reducer
 */
export function undoable( reducer, options = {} ) {
	const initialState = {
		past: [],
		present: reducer( undefined, {} ),
		future: [],
	};

	return ( state = initialState, action ) => {
		const { past, present, future } = state;

		switch ( action.type ) {
			case 'UNDO':
				// Can't undo if no past
				if ( ! past.length ) {
					break;
				}

				return {
					past: past.slice( 0, past.length - 1 ),
					present: past[ past.length - 1 ],
					future: [ present, ...future ],
				};

			case 'REDO':
				// Can't redo if no future
				if ( ! future.length ) {
					break;
				}

				return {
					past: [ ...past, present ],
					present: future[ 0 ],
					future: future.slice( 1 ),
				};
		}

		const nextPresent = reducer( present, action );

		if ( includes( options.resetTypes, action.type ) ) {
			return {
				past: [],
				present: nextPresent,
				future: [],
			};
		}

		if ( present === nextPresent ) {
			return state;
		}

		return {
			past: [ ...past, present ],
			present: nextPresent,
			future: [],
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
				},
			};

			return memo;
		}, {} );
		Object.defineProperties( state, getters );

		return state;
	}

	const initialState = withGetters( reducer( undefined, {} ) );

	return ( state = initialState, action ) => {
		const nextState = reducer( state.history, action );
		if ( nextState === state.history ) {
			return state;
		}

		return withGetters( nextState );
	};
}
