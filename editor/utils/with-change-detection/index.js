/**
 * External dependencies
 */
import { includes } from 'lodash';

/**
 * Higher-order reducer creator for tracking changes to state over time. The
 * returned reducer will include a `isDirty` property on the object reflecting
 * whether the original reference of the reducer has changed.
 *
 * @param {?Object} options            Optional options.
 * @param {?Array}  options.resetTypes Action types upon which to reset dirty.
 *
 * @return {Function} Higher-order reducer.
 */
const withChangeDetection = ( options = {} ) => ( reducer ) => {
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
};

export default withChangeDetection;
