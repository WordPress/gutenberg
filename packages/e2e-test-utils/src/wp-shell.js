/**
 * Internal dependencies
 */
import { rest } from './rest-api';

/**
 * Evaluate WordPress commands remotely via wp-shell test plugin.
 *
 * @example
 *
 * ```js
 * await shell`
 * 	return switch_theme( 'twentytwenty' );
 * `;
 * ```
 *
 * @param {Array<string>|string} strings The commands strings.
 * @param {...any}               args    Additional arguments.
 * @return {Promise<any>} Evaluated result.
 */
async function shell( strings, ...args ) {
	if ( Array.isArray( strings ) ) {
		let string = strings[ 0 ];
		for ( let i = 0; i < args.length; i += 1 ) {
			string += args[ i ] + strings[ i + 1 ];
		}
		return shell( string );
	}

	const response = await rest( {
		method: 'POST',
		path: '/wp-shell/eval',
		data: { commands: strings },
	} );

	return response.result;
}

export { shell };
