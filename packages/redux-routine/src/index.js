/**
 * Internal dependencies
 */
import isGenerator from './is-generator';
import createRuntime from './runtime';

/**
 * Creates a Redux middleware, given an object of controls where each key is an
 * action type for which to act upon, the value a function which returns either
 * a promise which is to resolve when evaluation of the action should continue,
 * or a value. The value or resolved promise value is assigned on the return
 * value of the yield assignment. If the control handler returns undefined, the
 * execution is not continued.
 *
 * @param {Record<string, (value: import('redux').AnyAction) => Promise<boolean> | boolean>} controls Object of control handlers.
 *
 * @return {import('redux').Middleware} Co-routine runtime
 */
export default function createMiddleware( controls = {} ) {
	return ( store ) => {
		const runtime = createRuntime( controls, store.dispatch );
		return ( next ) => ( action ) => {
			if ( ! isGenerator( action ) ) {
				return next( action );
			}

			return runtime( action );
		};
	};
}
