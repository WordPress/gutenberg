/**
 * External imports
 */
import { isString } from 'lodash';

/**
 * Casts value as an error if it's not one.
 *
 * @param {*} error The value to cast.
 *
 * @return {Error} The cast error.
 */
export default function castError( error ) {
	if ( ! ( error instanceof Error ) ) {
		error = new ReduxRoutineResponseError( error );
	}
	return error;
}

/**
 * A custom error for handling non-string error responses.
 *
 * Error responses are exposed on the `response` property of the error instance.
 *
 * @param {mixed} errorResponse
 * @param {...mixed} args
 * @return {Error} An instance of ReduxRoutineResponseError
 * @constructor
 */
export function ReduxRoutineResponseError( errorResponse, ...args ) {
	const instance = new Error(
		isString( errorResponse ) ? errorResponse : 'ReduxRoutineResponseError',
		...args
	);
	Object.setPrototypeOf( instance, Object.getPrototypeOf( this ) );
	instance.response = errorResponse;
	if ( Error.captureStackTrace ) {
		Error.captureStackTrace( instance, ReduxRoutineResponseError );
	}
	return instance;
}

ReduxRoutineResponseError.prototype = Object.create( Error.prototype, {
	constructor: {
		value: Error,
		enumerable: false,
		writable: true,
		configurable: true,
	},
} );

Object.setPrototypeOf( ReduxRoutineResponseError, Error );
