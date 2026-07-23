#!/usr/bin/env node

/**
 * External dependencies
 */
import glob from 'glob';
import { fileURLToPath } from 'url';
import { dirname, basename, resolve } from 'path';
import JSONC from 'jsonc-parser';
import { readFileSync } from 'fs';

let hasErrors = false;

const __dirname = dirname( fileURLToPath( import.meta.url ) );
const repoRoot = resolve( __dirname, '../..' );

const rootTsconfigJson = JSONC.parse(
	readFileSync( resolve( repoRoot, 'tsconfig.json' ), 'utf8' )
);

const packagesWithTypes = glob
	.sync( 'packages/*/tsconfig.json', { cwd: repoRoot } )
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
			readFileSync(
				resolve( repoRoot, `packages/${ packageName }/package.json` ),
				'utf8'
			)
		);
	} catch ( e ) {
		console.error(
			`Error parsing package.json for package ${ packageName }`
		);
		throw e;
	}

	const tsconfigs = glob.sync( `packages/${ packageName }/tsconfig*.json`, {
		cwd: repoRoot,
	} );
	const references = tsconfigs.flatMap(
		( p ) =>
			JSONC.parse( readFileSync( resolve( repoRoot, p ), 'utf8' ) )
				.references ?? []
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
