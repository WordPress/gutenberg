'use strict';

/**
 * Internal dependencies
 */
const DockerRuntime = require( './docker' );
const PlaygroundRuntime = require( './playground' );
const {
	UnsupportedCommandError,
	EnvironmentNotInitializedError,
} = require( './errors' );
const { setCache, getCache } = require( '../cache' );

const RUNTIME_CACHE_KEY = 'runtime';

const runtimes = {
	docker: DockerRuntime,
	playground: PlaygroundRuntime,
};

/**
 * Get a runtime instance by name.
 *
 * @param {string} name Runtime name ('docker' or 'playground').
 * @return {Object} Runtime instance.
 */
function getRuntime( name ) {
	const RuntimeClass = runtimes[ name ];
	if ( ! RuntimeClass ) {
		throw new Error( `Unknown runtime: ${ name }` );
	}
	return new RuntimeClass();
}

/**
 * Get all available runtime names.
 *
 * @return {string[]} Array of runtime names.
 */
function getAvailableRuntimes() {
	return Object.keys( runtimes );
}

/**
 * Save the runtime type to the cache file.
 * Called when start command initializes the environment.
 *
 * @param {string} runtimeName       The runtime name ('docker' or 'playground').
 * @param {string} workDirectoryPath Path to the wp-env work directory.
 */
async function saveRuntime( runtimeName, workDirectoryPath ) {
	await setCache( RUNTIME_CACHE_KEY, runtimeName, { workDirectoryPath } );
}

/**
 * Get the saved runtime type from cache.
 *
 * @param {string} workDirectoryPath Path to the wp-env work directory.
 * @return {Promise<string|undefined>} The saved runtime name, or undefined if not set.
 */
async function getSavedRuntime( workDirectoryPath ) {
	return await getCache( RUNTIME_CACHE_KEY, { workDirectoryPath } );
}

/**
 * Detect which runtime was used by reading from the cache.
 * Throws EnvironmentNotInitializedError if no runtime has been saved.
 *
 * @param {string} workDirectoryPath Path to the wp-env work directory.
 * @return {Promise<string>} Runtime name ('docker' or 'playground').
 * @throws {EnvironmentNotInitializedError} If environment not initialized.
 */
async function detectRuntime( workDirectoryPath ) {
	const savedRuntime = await getSavedRuntime( workDirectoryPath );
	if ( ! savedRuntime ) {
		throw new EnvironmentNotInitializedError();
	}
	return savedRuntime;
}

module.exports = {
	getRuntime,
	getAvailableRuntimes,
	detectRuntime,
	saveRuntime,
	getSavedRuntime,
	DockerRuntime,
	PlaygroundRuntime,
	UnsupportedCommandError,
	EnvironmentNotInitializedError,
};
