/**
 * External dependencies
 */
import { includes } from 'lodash';

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
