/**
 * Internal dependencies
 */
const debug = require( './debug' );

/**
 * Higher-order function which executes and returns the result of the given
 * handler only if the enhanced function is called with a payload indicating a
 * pull request event which did not originate from a forked repository.
 *
 * @param {Function} handler Original task.
 *
 * @return {Function} Enhanced task.
 */
function ifNotFork( handler ) {
	const newHandler = ( payload, ...args ) => {
		if (
			payload.pull_request.head.repo.full_name ===
			payload.pull_request.base.repo.full_name
		) {
			return handler( payload, ...args );
		}
		debug( `main: Skipping ${ handler.name } because we are in a fork.` );
	};
	Object.defineProperty( newHandler, 'name', { value: handler.name } );
	return newHandler;
}

module.exports = ifNotFork;
