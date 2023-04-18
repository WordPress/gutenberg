#!/usr/bin/env node

/**
 * External dependencies
 */
// @ts-ignore
import glob from 'glob';
import { dirname, basename } from 'path';
import stripJsonComments from 'strip-json-comments';
import { readFileSync } from 'fs';

let hasErrors = false;

const rootTsconfigJson = JSON.parse( readFileSync( 'tsconfig.json', 'utf8' ) );

const packagesWithTypes = glob
	.sync( 'packages/*/tsconfig.json' )
	.map( ( tsconfigPath ) => basename( dirname( tsconfigPath ) ) );

for ( const packageName of packagesWithTypes ) {
	if (
		! rootTsconfigJson.references.some(
			( reference ) => reference.path === `packages/${ packageName }`
		)
	) {
		console.error(
			`Missing reference to "packages/${ packageName }" in root tsconfig.json`
		);
		hasErrors = true;
	}

	const packageJson = JSON.parse(
		readFileSync( `packages/${ packageName }/package.json`, 'utf8' )
	);
	const tsconfigJson = JSON.parse(
		stripJsonComments(
			readFileSync( `packages/${ packageName }/tsconfig.json`, 'utf8' )
		)
	);
	if ( packageJson.dependencies ) {
		for ( const dependency of Object.keys( packageJson.dependencies ) ) {
			if ( dependency.startsWith( '@wordpress/' ) ) {
				const dependencyPackageName = dependency.slice(
					'@wordpress/'.length
				);
				if (
					packagesWithTypes.includes( dependencyPackageName ) &&
					! tsconfigJson.references?.some(
						( reference ) =>
							reference.path === `../${ dependencyPackageName }`
					)
				) {
					console.error(
						`Missing reference to "../${ dependencyPackageName }" in packages/${ packageName }/tsconfig.json`
					);
					hasErrors = true;
				}
			}
		}
	}
}

process.exit( hasErrors ? 1 : 0 );
