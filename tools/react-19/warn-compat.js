const PREFIX = '[wordpress-react-19]';

const warned = new Set();

/**
 * Warns about reliance on a React 18 compatibility shim that emulates an API
 * removed in React 19. Each distinct `key` warns at most once, so repeated use
 * of the same shim does not flood the console.
 *
 * @param {string} key     Unique identifier for the compatibility warning.
 * @param {string} message Human-readable warning message.
 */
export function warnCompat( key, message ) {
	if ( warned.has( key ) ) {
		return;
	}
	warned.add( key );
	if ( typeof console !== 'undefined' && console.warn ) {
		console.warn( `${ PREFIX } ${ message }` );
	}
}
