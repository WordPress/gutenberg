/**
 * Internal dependencies
 */
import { logged } from './utils';

function isDev(): boolean {
	// eslint-disable-next-line @wordpress/wp-global-usage
	return globalThis.SCRIPT_DEBUG === true;
}

/**
 * Shows a warning with `message` if environment is not `production`.
 *
 * @param message Message to show in the warning.
 *
 * @example
 * ```js
 * import warning from '@wordpress/warning';
 *
 * function MyComponent( props ) {
 *   if ( ! props.title ) {
 *     warning( '`props.title` was not passed' );
 *   }
 *   ...
 * }
 * ```
 */
export default function warning( message: string ): void {
	if ( ! isDev() ) {
		return;
	}

	// Skip if already logged.
	if ( logged.has( message ) ) {
		return;
	}

	// eslint-disable-next-line no-console
	console.warn( message );

	// Throwing an error and catching it immediately to improve debugging
	// A consumer can use 'pause on caught exceptions'
	// https://github.com/facebook/react/issues/4216
	try {
		throw Error( message );
	} catch ( x ) {
		// Do nothing.
	}
	logged.add( message );
}
