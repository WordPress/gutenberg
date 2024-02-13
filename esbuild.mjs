/**
 * External dependencies
 */
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const importAnalysisPlugin = {
	name: 'import-analysis',
	setup( build ) {
		const imports = { static: new Set(), dynamic: new Set() };
		const dynamicImporters = new Set();
		const externals = new Set( build.initialOptions.external || [] );
		const isExternal = ( p ) => externals.has( p );

		build.onResolve( { filter: /.*/ }, ( args ) => {
			if ( isExternal( args.path ) ) {
				if (
					dynamicImporters.has( args.importer ) ||
					args.kind === 'dynamic-import'
				) {
					imports.dynamic.add( args.path );
				} else if ( args.kind === 'import-statement' ) {
					imports.static.add( args.path );
				}
			} else if (
				dynamicImporters.has( args.importer ) ||
				args.kind === 'dynamic-import'
			) {
				dynamicImporters.add(
					// TODO: Improve this resolution.
					path.join( args.resolveDir, `${ args.path }.js` )
				);
			}

			return null; // Continue with the default resolve behavior
		} );

		build.onEnd( ( result ) => {
			if ( result.errors.length === 0 ) {
				const output = {
					static: Array.from( imports.static ),
					dynamic: Array.from( imports.dynamic ),
				};
				fs.writeFileSync(
					path.join(
						build.initialOptions.outdir,
						'import-analysis.json'
					),
					JSON.stringify( output, null, 2 )
				);
			}
		} );
	},
};

esbuild
	.build( {
		entryPoints: [ 'test-modules/view.js' ],
		bundle: true,
		outdir: 'test-modules/build',
		format: 'esm',
		external: [ '@wordpress/interactivity', '@wordpress/blob' ],
		plugins: [ importAnalysisPlugin ],
		minify: true,
		splitting: true,
	} )
	.catch( () => process.exit( 1 ) );
