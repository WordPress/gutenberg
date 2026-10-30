import type { Logger, LoggerItem } from './types';

export function createLogger(): Logger {
	/**
	 * Creates a log handler with block validation prefix.
	 *
	 * @param logger Original logger function.
	 *
	 * @return Augmented logger function.
	 */
	function createLogHandler( logger: Function ) {
		return ( message: unknown, ...args: unknown[] ) =>
			logger( 'Block validation: ' + message, ...args );
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

export function createQueuedLogger(): Logger {
	/**
	 * The list of enqueued log actions to print.
	 */
	const queue: LoggerItem[] = [];

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
