/**
 * External dependencies
 */
import type { Control } from 'rungen';
import { create } from 'rungen';
import isPromise from 'is-promise';
import type { Dispatch, AnyAction } from 'redux';

/**
 * Internal dependencies
 */
import { isActionOfType, isAction } from './is-action';

/**
 * Create a co-routine runtime.
 *
 * @param controls Object of control handlers.
 * @param dispatch Unhandled action dispatch.
 */
export default function createRuntime(
	controls: Record<
		string,
		( value: any ) => Promise< boolean > | boolean
	> = {},
	dispatch: Dispatch
) {
	const rungenControls = Object.entries( controls ).map(
		( [ actionType, control ] ): Control =>
			( value, next, iterate, yieldNext, yieldError ) => {
				if ( ! isActionOfType( value, actionType ) ) {
					return false;
				}
				const routine = control( value );
				if ( isPromise( routine ) ) {
					// Async control routine awaits resolution.
					routine.then( yieldNext, yieldError );
				} else {
					yieldNext( routine );
				}
				return true;
			}
	);

	const unhandledActionControl = (
		value: AnyAction | unknown,
		next: () => void
	) => {
		if ( ! isAction( value ) ) {
			return false;
		}
		dispatch( value );
		next();
		return true;
	};
	rungenControls.push( unhandledActionControl );

	const rungenRuntime = create( rungenControls );

	return ( action: AnyAction | Generator ) =>
		new Promise( ( resolve, reject ) =>
			rungenRuntime(
				action,
				( result ) => {
					if ( isAction( result ) ) {
						dispatch( result );
					}
					resolve( result );
				},
				reject
			)
		);
}
