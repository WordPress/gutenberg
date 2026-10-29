import type { Middleware } from 'redux';
import isGenerator from './is-generator';
import createRuntime from './runtime';
import type { Controls, RoutineDispatch } from './types';

/**
 * Object of control handlers keyed by action type.
 */
export type { Controls } from './types';

/**
 * Dispatches a generator through the co-routine runtime.
 */
export type { RoutineDispatch } from './types';

/**
 * Creates a Redux middleware, given an object of controls where each key is an
 * action type for which to act upon, the value a function which returns either
 * a promise which is to resolve when evaluation of the action should continue,
 * or a value. The value or resolved promise value is assigned on the return
 * value of the yield assignment, including when the result is undefined.
 *
 * @param controls Object of control handlers.
 *
 * @return Co-routine runtime
 */
export default function createMiddleware(
	controls: Controls = {}
): Middleware< RoutineDispatch > {
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
