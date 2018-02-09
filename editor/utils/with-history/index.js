/**
 * External dependencies
 */
import { includes } from 'lodash';

/**
 * Reducer enhancer which transforms the result of the original reducer into an
 * object tracking its own history (past, present, future).
 *
 * @param {Function} reducer              Original reducer.
 * @param {?Object}  options              Optional options.
 * @param {?Array}   options.resetTypes   Action types upon which to clear past.
 * @param {Function} options.shouldOverwriteState A function passed the previous and current action.
 *                                        Returning true means we don't create a new undo level
 *                                        and replace the previous last item.
 *
 * @return {Function} Enhanced reducer.
 */
export default function withHistory( reducer, options = {} ) {
	const initialState = {
		past: [],
		present: reducer( undefined, {} ),
		future: [],
		previousAction: null,
	};

	return ( state = initialState, action ) => {
		const { past, present, future, previousAction } = state;

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
					previousAction: null,
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
					previousAction: null,
				};
		}

		const nextPresent = reducer( present, action );

		if ( includes( options.resetTypes, action.type ) ) {
			return {
				past: [],
				present: nextPresent,
				future: [],
				previousAction: null,
			};
		}

		if ( present === nextPresent ) {
			return state;
		}

		let newPast;
		const { shouldOverwriteState = () => false } = options;
		if ( past.length && previousAction && shouldOverwriteState( previousAction, action ) ) {
			newPast = [ ...past.slice( 0, -1 ), present ];
		} else {
			newPast = [ ...past, present ];
		}

		return {
			past: newPast,
			present: nextPresent,
			future: [],
			previousAction: action,
		};
	};
}
