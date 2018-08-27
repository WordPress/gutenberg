/**
 * External dependencies
 */
import { includes } from 'lodash';

/**
 * Default options for withChangeDetection reducer enhancer. Refer to
 * withChangeDetection documentation for options explanation.
 *
 * @see withChangeDetection
 *
 * @type {Object}
 */
const DEFAULT_OPTIONS = {
	resetTypes: [],
	ignoreTypes: [],
	isIgnored: () => false,
};

/**
 * Higher-order reducer creator for tracking changes to state over time. The
 * returned reducer will include a `isDirty` property on the object reflecting
 * whether the original reference of the reducer has changed.
 *
 * @param {?Object}   options             Optional options.
 * @param {?Array}    options.ignoreTypes Action types at which to skip check.
 * @param {?Array}    options.resetTypes  Action types at which to reset dirty.
 * @param {?Function} options.isIgnored   Function given action, to return true
 *                                        if to disregard changing state.
 *
 * @return {Function} Higher-order reducer.
 */
const withChangeDetection = ( options ) => ( reducer ) => {
	options = { ...DEFAULT_OPTIONS, ...options };

	return ( state, action ) => {
		let nextState = reducer( state, action );

		// If initial state, assume non-dirty.
		if ( state === undefined ) {
			return {
				...nextState,
				isDirty: false,
			};
		}

		// Reset at:
		//  - Initial state
		//  - Reset types
		const isReset = (
			state === undefined ||
			includes( options.resetTypes, action.type )
		);

		const isChanging = state !== nextState;

		// If not intending to update dirty flag, return early and avoid clone.
		if ( ! isChanging && ! isReset ) {
			return state;
		}

		// Avoid mutating state, unless it's already changing by original
		// reducer.
		if ( ! isChanging ) {
			nextState = { ...nextState };
		}

		const isIgnored = (
			includes( options.ignoreTypes, action.type ) ||
			options.isIgnored( action )
		);

		if ( isIgnored ) {
			// Preserve the original value if ignored.
			nextState.isDirty = state.isDirty;
		} else {
			nextState.isDirty = ! isReset && isChanging;
		}

		return nextState;
	};
};

export default withChangeDetection;
