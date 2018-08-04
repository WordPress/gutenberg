/**
 * Internal dependencies
 */
import isGenerator from './is-generator';
import castError from './cast-error';

/**
 * Creates a Redux middleware, given an object of controls where each key is an
 * action type for which to act upon, the value a function which returns either
 * a promise which is to resolve when evaluation of the action should continue,
 * or a value. The value or resolved promise value is assigned on the return
 * value of the yield assignment. If the control handler returns undefined, the
 * execution is not continued.
 *
 * @param {Object} controls Object of control handlers.
 *
 * @return {Function} Redux middleware function.
 */
export default function createMiddleware( controls = {} ) {
	return ( store ) => ( next ) => ( action ) => {
		if ( ! isGenerator( action ) ) {
			return next( action );
		}

		function step( nextAction ) {
			if ( ! nextAction ) {
				return;
			}

			const control = controls[ nextAction.type ];
			if ( typeof control === 'function' ) {
				const routine = control( nextAction );

				if ( routine instanceof Promise ) {
					// Async control routine awaits resolution.
					routine.then(
						( result ) => step( action.next( result ).value ),
						( error ) => action.throw( castError( error ) ),
					);
				} else if ( routine !== undefined ) {
					// Sync control routine steps synchronously.
					step( action.next( routine ).value );
				}
			} else {
				// Uncontrolled action is dispatched.
				store.dispatch( nextAction );
				step( action.next().value );
			}
		}

		step( action.next().value );
	};
}
