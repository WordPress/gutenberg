/**
 * External dependencies
 */
import { includes, first, last, drop, dropRight } from 'lodash';

/**
 * Reducer enhancer which transforms the result of the original reducer into an
 * object tracking its own history (past, present, future).
 *
 * @param {Function} reducer            Original reducer.
 * @param {?Object}  options            Optional options.
 * @param {?Array}   options.resetTypes Action types upon which to clear past.
 *
 * @return {Function} Enhanced reducer.
 */
export default function withHistory( reducer, options = {} ) {
	const initialPresent = reducer( undefined, {} );

	const initialState = {
		// Past already contains record of present since changes are buffered in present.
		past: [ initialPresent ],
		present: initialPresent,
		future: [],
	};

	let lastAction;

	return ( state = initialState, action ) => {
		const { past, present, future } = state;
		const previousAction = lastAction;
		const {
			resetTypes = [],
			shouldOverwriteState = () => false,
		} = options;

		lastAction = action;

		switch ( action.type ) {
			case 'UNDO':
				// If there are changes in buffer, push buffer to the future.
				if ( last( past ) !== present ) {
					return {
						past,
						present: last( past ),
						future: [ present, ...future ],
					};
				}

				// Can't undo if no past.
				// If the present "buffer" is the same as the last record,
				// There is no further past.
				if ( past.length < 2 ) {
					return state;
				}

				const newPast = dropRight( past );

				return {
					past: newPast,
					present: last( newPast ),
					future: [ present, ...future ],
				};
			case 'REDO':
				// Can't redo if no future.
				if ( ! future.length ) {
					return state;
				}

				return {
					past: [ ...past, first( future ) ],
					present: first( future ),
					future: drop( future ),
				};

			case 'CREATE_UNDO_LEVEL':
				// Already has this level.
				if ( last( past ) === present ) {
					return state;
				}

				return {
					past: [ ...past, present ],
					present,
					future: [],
				};
		}

		const nextPresent = reducer( present, action );

		if ( includes( resetTypes, action.type ) ) {
			return {
				past: [ nextPresent ],
				present: nextPresent,
				future: [],
			};
		}

		if ( present === nextPresent ) {
			return state;
		}

		if ( shouldOverwriteState( action, previousAction ) ) {
			return {
				past,
				present: nextPresent,
				future,
			};
		}

		return {
			past: [ ...past, present ],
			present: nextPresent,
			future: [],
		};
	};
}
