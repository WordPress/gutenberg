/**
 * External dependencies
 */
import { includes } from 'lodash';

/**
 * Reducer enhancer for tracking changes to reducer state over time. The
 * returned reducer will include a new `isDirty` property on the object
 * reflecting whether the original reference of the reducer has changed.
 *
 * @param {Function} reducer            Original reducer.
 * @param {?Object}  options            Optional .
 * @param {?Array}   options.resetTypes Action types upon which to reset dirty.
 *
 * @return {Function} Enhanced reducer.
 */
export default function withChangeDetection( reducer, options = {} ) {
	return ( state, action ) => {
		const nextState = reducer( state, action );

		// Reset at:
		//  - Initial state
		//  - Reset types
		const isReset = (
			state === undefined ||
			includes( options.resetTypes, action.type )
		);

		if ( isReset ) {
			return {
				...nextState,
				isDirty: false,
			};
		}

		const isChanging = state !== nextState;

		if ( isChanging ) {
			nextState.isDirty = true;
		}

		return nextState;
	};
}
