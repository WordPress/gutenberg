/**
 * The list of enqueued log actions to print.
 *
 * @type {Array}
 */
let queue = [];

/**
 * Whether the logger is in transaction mode.
 *
 * @type {boolean}
 */
let isTransaction = false;

/**
 * Creates a logger with block validation prefix.
 *
 * @param {Function} logger Original logger function.
 *
 * @return {Function} Augmented logger function.
 */
function createLogger( logger ) {
	let log = ( message, ...args ) => logger( 'Block validation: ' + message, ...args );

	// In test environments, pre-process the sprintf message to improve
	// readability of error messages. We'd prefer to avoid pulling in this
	// dependency in runtime environments, and it can be dropped by a combo
	// of Webpack env substitution + UglifyJS dead code elimination.
	if ( process.env.NODE_ENV === 'test' ) {
		// eslint-disable-next-line import/no-extraneous-dependencies
		log = ( ...args ) => logger( require( 'sprintf-js' ).sprintf( ...args ) );
	}

	return ( ...args ) => {
		if ( isTransaction ) {
			queue.push( () => log( ...args ) );
		} else {
			log( ...args );
		}
	};
}

const logger = {
	startTransaction() {
		queue = [];
		isTransaction = true;
	},
	commit() {
		queue.forEach( ( log ) => log() );
		this.flush();
	},
	rollback() {
		queue = [];
		isTransaction = false;
	},
	hasQueuedItems() {
		return queue.length > 0;
	},
	// eslint-disable-next-line no-console
	error: createLogger( console.error ),
	// eslint-disable-next-line no-console
	warning: createLogger( console.warn ),
};

export default logger;
