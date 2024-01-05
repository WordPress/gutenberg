import * as esbuild from 'esbuild';
import fs from 'node:fs';

const importAnalysisPlugin = {
	name: 'import-analysis',
	setup( build ) {
		const imports = { static: [], dynamic: [] };
		const externals = new Set( build.initialOptions.external || [] );
		const isExternal = ( path ) => externals.has( path );

		build.onResolve( { filter: /.*/ }, ( args ) => {
			if ( args.kind === 'import-statement' && isExternal( args.path ) ) {
				imports.static.push( {
					path: args.path,
					importer: args.importer,
				} );
			} else if (
				args.kind === 'dynamic-import' &&
				isExternal( args.path )
			) {
				imports.dynamic.push( {
					path: args.path,
					importer: args.importer,
				} );
			}
			return null; // Continue with the default resolve behavior
		} );

		build.onEnd( ( result ) => {
			if ( result.errors.length === 0 ) {
				fs.writeFileSync(
					'import-analysis.json',
					JSON.stringify( imports, null, 2 )
				);
			}
		} );
	},
};

// Sample build script using the plugin
esbuild
	.build( {
		entryPoints: [ 'packages/block-library/src/file/view.js' ],
		bundle: true,
		outdir: 'out',
		format: 'esm',
		external: [ '@wordpress/interactivity', 'lodash' ],
		plugins: [ importAnalysisPlugin ],
		minify: true,
		splitting: true,
	} )
	.catch( () => process.exit( 1 ) );
