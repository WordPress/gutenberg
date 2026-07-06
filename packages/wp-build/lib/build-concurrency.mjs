/**
 * External dependencies
 */
import os from 'node:os';
import esbuild from 'esbuild';

const MIN_DEFAULT_BUILD_CONCURRENCY = 2;
const MAX_DEFAULT_BUILD_CONCURRENCY = 8;

/**
 * @typedef {Object} QueuedBuild
 * @property {() => Promise<unknown> | unknown} task    Task to run.
 * @property {(value: unknown) => void}         resolve Promise resolver.
 * @property {(reason?: unknown) => void}       reject  Promise rejecter.
 */

let buildConcurrency = getDefaultBuildConcurrency();
let activeBuilds = 0;
/** @type {QueuedBuild[]} */
const queuedBuilds = [];

/**
 * Gets the number of CPUs available to the current process.
 *
 * @return {number} Available parallelism.
 */
function getAvailableParallelism() {
	return typeof os.availableParallelism === 'function'
		? os.availableParallelism()
		: os.cpus().length;
}

/**
 * Get the default number of concurrent esbuild builds.
 *
 * @param {number} availableParallelism Available parallelism to use.
 * @return {number} Default build concurrency.
 */
export function getDefaultBuildConcurrency(
	availableParallelism = getAvailableParallelism()
) {
	return Math.max(
		MIN_DEFAULT_BUILD_CONCURRENCY,
		Math.min(
			MAX_DEFAULT_BUILD_CONCURRENCY,
			Math.ceil( availableParallelism / 2 )
		)
	);
}

/**
 * Parse a concurrency override.
 *
 * @param {string|undefined} value  Concurrency override value.
 * @param {string}           source Source of the override for error messages.
 * @return {number|undefined} Parsed concurrency, or undefined when unset.
 */
export function parseBuildConcurrency( value, source ) {
	if ( value === undefined ) {
		return undefined;
	}

	if ( ! /^\d+$/.test( value ) || Number( value ) === 0 ) {
		throw new Error(
			`Invalid ${ source } value: ${ JSON.stringify(
				value
			) }. Expected a positive integer.`
		);
	}

	return Number( value );
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
 * Runs an esbuild build while respecting the global wp-build concurrency limit.
 *
 * @param {import('esbuild').BuildOptions} buildOptions Esbuild build options.
 * @return {Promise<import('esbuild').BuildResult>} Esbuild build result.
 */
export function buildWithConcurrency( buildOptions ) {
	return enqueueBuild( () => esbuild.build( buildOptions ) );
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
