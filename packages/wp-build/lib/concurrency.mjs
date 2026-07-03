/**
 * Concurrency utilities for build phases.
 *
 * Build phases fan out one task per unit (package, route, widget). Each unit
 * spawns its own esbuild/sass work, so unbounded fan-out exhausts memory on
 * projects with many units; these helpers bound how many run at once.
 */

/**
 * External dependencies
 */
import os from 'node:os';

/**
 * Create a scheduler that runs async tasks with a concurrency limit.
 *
 * Tasks start immediately while fewer than `limit` are running; the rest
 * queue and start as slots free up.
 *
 * @param {number} limit Maximum number of tasks running at the same time.
 * @return {(task: () => Promise<any>) => Promise<any>} Schedules a task and
 * resolves with its result.
 */
export function createLimiter( limit ) {
	let active = 0;
	/** @type {Array<() => void>} */
	const queue = [];

	const runNext = () => {
		if ( active >= limit ) {
			return;
		}
		const start = queue.shift();
		if ( ! start ) {
			return;
		}
		active++;
		start();
	};

	return function runLimited( task ) {
		return new Promise( ( resolve, reject ) => {
			queue.push( () => {
				Promise.resolve()
					.then( task )
					.then( resolve, reject )
					.finally( () => {
						active--;
						runNext();
					} );
			} );
			runNext();
		} );
	};
}

/**
 * Resolve the concurrency limit for build phases.
 *
 * Precedence: `--concurrency` CLI flag, then the `WP_BUILD_CONCURRENCY`
 * environment variable, then the machine's available parallelism. The limit
 * is machine-specific, which is why it is not read from `wpPlugin` config.
 *
 * @param {string|undefined}                 [flagValue] Raw value of the `--concurrency` CLI flag.
 * @param {Record<string, string|undefined>} [env]       Environment variables. Defaults to `process.env`.
 * @return {number} Concurrency limit (a positive integer).
 */
export function resolveConcurrency( flagValue, env = process.env ) {
	const rawValue = flagValue ?? env.WP_BUILD_CONCURRENCY;

	if ( rawValue === undefined || rawValue === '' ) {
		return os.availableParallelism();
	}

	const parsed = Number( String( rawValue ) );
	if ( ! Number.isInteger( parsed ) || parsed < 1 ) {
		throw new Error(
			`Invalid concurrency value "${ rawValue }". Expected a positive integer.`
		);
	}

	return parsed;
}
