#!/usr/bin/env node

/**
 * External dependencies
 */
const { get } = require( 'https' );
const { spawn } = require( 'child_process' );

/**
 * Returns a promise resolving with the version number of the latest available
 * version of NPM.
 *
 * @return {Promise<string>} Promise resolving with latest NPM version.
 */
async function getLatestNPMVersion() {
	return new Promise( ( resolve, reject ) => {
		get(
			'https://registry.npmjs.org/npm',
			{
				headers: {
					// See: https://github.com/npm/registry/blob/master/docs/responses/package-metadata.md
					Accept: 'application/vnd.npm.install-v1+json',
				},
			},
			async ( response ) => {
				if ( response.statusCode !== 200 ) {
					return reject(
						new Error( 'Package data for NPM not found' )
					);
				}

				let body = '';
				for await ( const chunk of response ) {
					body += chunk.toString();
				}

				let data;
				try {
					data = JSON.parse( body );
				} catch {
					return reject(
						new Error(
							'Package data for NPM returned invalid response body'
						)
					);
				}

				resolve( data[ 'dist-tags' ].latest );
			}
		);
	} );
}

/**
 * Returns a promise resolving with the version number of the local installed
 * version of NPM.
 *
 * @return {Promise<string>} Promise resolving with local installed NPM version.
 */
async function getLocalNPMVersion() {
	return new Promise( async ( resolve ) => {
		const childProcess = spawn( 'npm', [ '-v' ] );

		let output = '';
		for await ( const chunk of childProcess.stdout ) {
			output += chunk.toString();
		}

		resolve( output.trim() );
	} );
}

Promise.all( [ getLatestNPMVersion(), getLocalNPMVersion() ] )
	.then( ( [ latest, local ] ) => {
		if ( latest !== local ) {
			throw new Error(
				`The local NPM version does not match the expected latest version. Expected ${ latest }, found ${ local }.

You must run the latest version of NPM to commit a change to the \`package-lock.json\` file.

Run \`npm install --global npm@latest\`, then try again.`
			);
		}
	} )
	.catch( ( error ) => {
		// Disable reason: A failure should log to the terminal.

		// eslint-disable-next-line no-console
		console.error( 'Latest NPM check failed!\n\n' + error.toString() );
		process.exitCode = 1;
	} );
