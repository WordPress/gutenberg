#!/usr/bin/env node

/**
 * External dependencies
 */
const { green, red, yellow } = require( 'chalk' );
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
					// By passing a specialized `Accept` header, the registry
					// will return an abbreviated form of the package data which
					// includes enough detail to determine the latest version.
					//
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
		).on( 'error', ( error ) => {
			if (
				/** @type {NodeJS.ErrnoException} */ ( error ).code ===
				'ENOTFOUND'
			) {
				error = new Error( `Could not contact the NPM registry to determine latest version.

This could be due to an intermittent outage of the service, or because you are not connected to the internet.

Because it is important that \`package-lock.json\` files only be committed while running the latest version of NPM, this commit has been blocked.

If you are certain of your changes and desire to commit anyways, you should either connect to the internet or bypass commit verification using ${ yellow(
					'git commit --no-verify'
				) } .` );
			}

			reject( error );
		} );
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
				`The local NPM version does not match the expected latest version. Expected ${ green(
					latest
				) }, found ${ red( local ) }.

It is required that you have the latest version of NPM installed in order to commit a change to the package-lock.json file.

Run ${ yellow(
					'npm install --global npm@latest'
				) } to install the latest version of NPM. Before retrying your commit, run ${ yellow(
					'npm install'
				) } once more to ensure the package-lock.json contents are correct. If there are any changes to the file, they should be included in your commit.`
			);
		}
	} )
	.catch( ( error ) => {
		console.error(
			'Latest NPM check failed!\n\n' + error.toString() + '\n'
		);
		process.exitCode = 1;
	} );
