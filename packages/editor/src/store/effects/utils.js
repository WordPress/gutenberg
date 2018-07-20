/**
 * WordPress dependencies
 */
import { select, subscribe } from '@wordpress/data';

/**
 * Waits for the resolution of a selector before returning the selector's value.
 *
 * @param {string} namespace    Store namespace.
 * @param {string} selectorName Selector name.
 * @param {Array} args          Selector args.
 *
 * @return {Promise} Selector result.
 */
export function resolveSelector( namespace, selectorName, ...args ) {
	return new Promise( ( resolve ) => {
		const hasFinished = () => select( 'core/data' ).hasFinishedResolution( namespace, selectorName, args );
		const getResult = () => select( namespace )[ selectorName ].apply( null, args );

		// We need to trigger the selector (to trigger the resolver)
		const result = getResult();
		if ( hasFinished() ) {
			return resolve( result );
		}

		const unsubscribe = subscribe( () => {
			if ( hasFinished() ) {
				unsubscribe();
				resolve( getResult() );
			}
		} );
	} );
}
