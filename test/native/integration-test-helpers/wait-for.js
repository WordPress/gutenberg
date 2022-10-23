/**
 * External dependencies
 */
import { act } from '@testing-library/react-native';

/**
 * Custom implementation of the "waitFor" utility to
 * prevent the issue: https://git.io/JYYGE
 *
 * @param {Function} cb                 Callback on which to wait.
 * @param {Object}   options            Configuration options for waiting.
 * @param {number}   [options.timeout]  Total time to wait for. If the execution exceeds this time, the call will be considered rejected.
 * @param {number}   [options.interval] Time to wait between calls.
 * @return {*} Result of calling the callback function if it's not rejected.
 */
export function waitFor(
	cb,
	{ timeout, interval } = { timeout: 1000, interval: 50 }
) {
	let result;
	let lastError;
	const check = ( resolve, reject, time = 0 ) => {
		try {
			result = cb();
		} catch ( error ) {
			lastError = error;
		}
		if ( ! result && time < timeout ) {
			setTimeout(
				() => check( resolve, reject, time + interval ),
				interval
			);
			return;
		}
		resolve( result );
	};
	return new Promise( ( resolve, reject ) =>
		act(
			() => new Promise( ( internalResolve ) => check( internalResolve ) )
		).then( () => {
			if ( ! result ) {
				reject(
					`waitFor timed out after ${ timeout }ms for callback:\n${ cb }\n${ lastError.toString() }`
				);
				return;
			}
			resolve( result );
		} )
	);
}
