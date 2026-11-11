import os from 'node:os';
import { build } from 'rolldown';

/**
 * @typedef {Object} QueuedBuild
 * @property {() => Promise<unknown> | unknown} task    Task to run.
 * @property {(value: unknown) => void}         resolve Promise resolver.
 * @property {(reason?: unknown) => void}       reject  Promise rejecter.
 */

let buildConcurrency = 1;
let activeBuilds = 0;
/** @type {QueuedBuild[]} */
const queuedBuilds = [];

/**
 * Get the default number of concurrent esbuild builds: half of the available
 * parallelism, rounded up.
 *
 * @param {number} availableParallelism Available parallelism to use.
 * @return {number} Default build concurrency.
 */
export function getDefaultBuildConcurrency(
	availableParallelism = os.availableParallelism()
) {
	return Math.max( 1, Math.ceil( availableParallelism / 2 ) );
}

/**
 * Set the maximum number of concurrent esbuild builds.
 *
 * @param {number} concurrency Build concurrency.
 */
export function setBuildConcurrency( concurrency ) {
	buildConcurrency = concurrency;
	runNextBuilds();
}

/**
 * Runs a Rolldown build while respecting the global wp-build concurrency limit.
 *
 * @param {import('rolldown').BuildOptions} buildOptions Rolldown build options.
 * @return {Promise<import('rolldown').RolldownOutput>} Rolldown build output.
 */
export function buildWithConcurrency( buildOptions ) {
	return enqueueBuild( () => build( buildOptions ) );
}

/**
 * Runs an arbitrary async task while respecting the build concurrency limit.
 *
 * @template T
 * @param {() => Promise<T> | T} task Task to run.
 * @return {Promise<T>} Task result.
 */
export function enqueueBuild( task ) {
	return new Promise( ( resolve, reject ) => {
		queuedBuilds.push( {
			task,
			resolve: ( value ) =>
				resolve( /** @type {T | PromiseLike<T>} */ ( value ) ),
			reject,
		} );
		runNextBuilds();
	} );
}

/**
 * Starts queued build tasks while capacity is available.
 */
function runNextBuilds() {
	while ( activeBuilds < buildConcurrency && queuedBuilds.length > 0 ) {
		const queuedBuild = queuedBuilds.shift();
		if ( ! queuedBuild ) {
			return;
		}
		const { task, resolve, reject } = queuedBuild;
		activeBuilds++;
		Promise.resolve()
			.then( task )
			.then( resolve, reject )
			.finally( () => {
				activeBuilds--;
				runNextBuilds();
			} );
	}
}
