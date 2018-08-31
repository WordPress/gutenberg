/**
 * External dependencies
 */
import { create } from 'rungen';
import { map, isString } from 'lodash';

/**
 * Internal dependencies
 */
import castError from './cast-error';

/**
 * Create a co-routine runtime.
 *
 * @param {Object}    controls Object of control handlers.
 * @param {function}  dispatch Unhandled action dispatch.
 *
 * @return {function} co-routine runtime
 */
export default function createRuntime( controls = {}, dispatch ) {
	const rungenControls = map( controls, ( control, actionType ) => ( value, next, iterate, yieldNext, yieldError ) => {
		if ( typeof value !== 'object' || value.type !== actionType ) {
			return false;
		}
		const routine = control( value );
		if ( routine instanceof Promise ) {
			// Async control routine awaits resolution.
			routine.then(
				next,
				( error ) => yieldError( castError( error ) ),
			);
		} else {
			next( routine );
		}
		return true;
	} );

	const unhandledActionControl = ( value, next ) => {
		if ( typeof value !== 'object' || ! isString( value.type ) ) {
			return false;
		}
		dispatch( value );
		next();
		return true;
	};
	rungenControls.push( unhandledActionControl );

	const rungenRuntime = create( rungenControls );

	return ( action ) => new Promise( ( resolve, reject ) =>
		rungenRuntime( action, ( result ) => {
			if ( typeof result === 'object' && isString( result.type ) ) {
				dispatch( result );
			}
			resolve( result );
		}, reject )
	);
}
