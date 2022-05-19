/**
 * @typedef LoggerItem
 * @property {Function}   log  Which logger recorded the message
 * @property {Array<any>} args White arguments were supplied to the logger
 */

export function createLogger() {
	/**
	 * Creates a log handler with block validation prefix.
	 *
	 * @param {Function} logger Original logger function.
	 *
	 * @return {Function} Augmented logger function.
	 */
	function createLogHandler( logger ) {
		let log = ( message, ...args ) =>
			logger( 'Block validation: ' + message, ...args );

		// In test environments, pre-process string substitutions to improve
		// readability of error messages. We'd prefer to avoid pulling in this
		// dependency in runtime environments, and it can be dropped by a combo
		// of Webpack env substitution + UglifyJS dead code elimination.
		if ( process.env.NODE_ENV === 'test' ) {
			log = ( ...args ) => logger( require( 'util' ).format( ...args ) );
		}

		return log;
	}

	return {
		// eslint-disable-next-line no-console
		error: createLogHandler( console.error ),
		// eslint-disable-next-line no-console
		warning: createLogHandler( console.warn ),
		getItems() {
			return [];
		},
	};
}

export function createQueuedLogger() {
	/**
	 * The list of enqueued log actions to print.
	 *
	 * @type {Array<LoggerItem>}
	 */
	const queue = [];

	const logger = createLogger();

	return {
		error( ...args ) {
			queue.push( { log: logger.error, args } );
		},
		warning( ...args ) {
			queue.push( { log: logger.warning, args } );
		},
		getItems() {
			return queue;
		},
	};
}
