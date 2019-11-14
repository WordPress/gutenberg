'use strict';

/**
 * External dependencies
 */
const util = require( 'util' );
const fs = require( 'fs' );

/**
 * Internal dependencies
 */
const detectContext = require( './detect-context' );

/**
 * Promisified dependencies
 */
const readFile = util.promisify( fs.readFile );

/**
 * Returns an array of dependencies to be mounted in the Docker image.
 *
 * Reads from the wp-env.json file in the current directory and uses detect
 * context to make sure the specified dependencies exist and are plugins
 * and/or themes.
 *
 * @return {Array<detectContext.Context>} An array of dependencies in the context format.
 */
module.exports = async function resolveDependencies() {
	let envFile;
	try {
		envFile = await readFile( './wp-env.json' );
	} catch ( error ) {
		return [];
	}

	const { themes, plugins } = JSON.parse( envFile );

	const dependencyResolvers = [];
	if ( Array.isArray( themes ) ) {
		dependencyResolvers.push( ...themes.map( detectContext ) );
	}

	if ( Array.isArray( plugins ) ) {
		dependencyResolvers.push( ...plugins.map( detectContext ) );
	}

	// Return all dependencies which have been detected to be a plugin or a theme.
	const dependencies = await Promise.all( dependencyResolvers );
	return dependencies.filter( ( { type } ) => !! type );
};
