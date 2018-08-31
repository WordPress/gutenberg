/**
 * Internal dependencies
 */
import castError from './cast-error';

/**
 * Create a co-routine runtime.
 *
 * @param {Object}    controls Object of control handlers.
 *
 * @return {function} co-routine runtime
 */
export default function createRuntime( controls = {} ) {
	function step( generator, nextAction, dispatch ) {
		if ( ! nextAction ) {
			return;
		}

		const control = controls[ nextAction.type ];
		if ( typeof control === 'function' ) {
			const routine = control( nextAction );

			if ( routine instanceof Promise ) {
				// Async control routine awaits resolution.
				routine.then(
					( result ) => step( generator, generator.next( result ).value, dispatch ),
					( error ) => generator.throw( castError( error ) ),
				);
			} else if ( routine !== undefined ) {
				// Sync control routine steps synchronously.
				step( generator, generator.next( routine ).value, dispatch );
			}
		} else {
			// Uncontrolled action is dispatched.
			dispatch( nextAction );
			step( generator, generator.next().value, dispatch );
		}
	}

	return ( generator, dispatch ) => step(
		generator,
		generator.next().value,
		dispatch
	);
}
