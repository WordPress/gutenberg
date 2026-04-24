#!/usr/bin/env node

/**
 * External dependencies
 */
import glob from 'glob';
import { dirname, basename } from 'path';
import JSONC from 'jsonc-parser';
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

	let packageJson;
	try {
		packageJson = JSON.parse(
			readFileSync( `packages/${ packageName }/package.json`, 'utf8' )
		);
	} catch ( e ) {
		console.error(
			`Error parsing package.json for package ${ packageName }`
		);
		throw e;
	}

	const tsconfigs = glob.sync( `packages/${ packageName }/tsconfig*.json` );
	const references = tsconfigs.flatMap(
		( path ) => JSONC.parse( readFileSync( path, 'utf8' ) ).references ?? []
	);

	if ( packageJson.dependencies ) {
		for ( const dependency of Object.keys( packageJson.dependencies ) ) {
			if ( dependency.startsWith( '@wordpress/' ) ) {
				const dependencyPackageName = dependency.slice(
					'@wordpress/'.length
				);
				if (
					packagesWithTypes.includes( dependencyPackageName ) &&
					! references.some(
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
