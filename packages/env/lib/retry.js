/**
 * External dependencies
 */
const util = require( 'util' );

/**
 * Promisified dependencies
 */
const sleep = util.promisify( setTimeout );

/**
 * Performs the given action again and again until it does not throw an error.
 *
 * @param {Function} action               The action to perform.
 * @param {Object}   options
 * @param {number}   options.times        How many times to try before giving up.
 * @param {number}   [options.delay=5000] How long, in milliseconds, to wait between each try.
 */
module.exports = async function retry( action, { times, delay = 5000 } ) {
	let tries = 0;
	while ( true ) {
		try {
			return await action();
		} catch ( error ) {
			if ( ++tries >= times ) {
				throw error;
			}
			await sleep( delay );
		}
	}
};
