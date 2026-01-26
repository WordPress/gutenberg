'use strict';

/**
 * External dependencies
 */
const { existsSync } = require( 'fs' );
const path = require( 'path' );

/**
 * Internal dependencies
 */
const DockerRuntime = require( './docker' );
const PlaygroundRuntime = require( './playground' );
const { UnsupportedCommandError } = require( './errors' );

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
 * Detect which runtime was used based on files in the work directory.
 * Returns 'playground' if playground-blueprint.json exists, otherwise 'docker'.
 *
 * @param {string} workDirectoryPath Path to the wp-env work directory.
 * @return {string} Runtime name ('docker' or 'playground').
 */
function detectRuntime( workDirectoryPath ) {
	const playgroundBlueprintFile = path.join(
		workDirectoryPath,
		'playground-blueprint.json'
	);
	if ( existsSync( playgroundBlueprintFile ) ) {
		return 'playground';
	}
	return 'docker';
}

module.exports = {
	getRuntime,
	getAvailableRuntimes,
	detectRuntime,
	DockerRuntime,
	PlaygroundRuntime,
	UnsupportedCommandError,
};
