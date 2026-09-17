import { createRequire } from 'node:module';
import path from 'node:path';
import { normalizePath } from 'vite';

const EMPTY_MODULE_ID = '\0postcss-browser-empty';

export function createPostcssBrowserPlugin( rootDir ) {
	const require = createRequire(
		path.join( rootDir, 'packages/block-editor/package.json' )
	);
	const packagePath = require.resolve( 'postcss/package.json' );
	const packageDirectory = normalizePath( path.dirname( packagePath ) ) + '/';
	const { browser } = require( packagePath );
	const disabledImports = new Set(
		Object.keys( browser ).filter(
			( id ) => ! id.startsWith( '.' ) && browser[ id ] === false
		)
	);

	return {
		name: 'postcss-browser-imports',
		resolveId( id, importer ) {
			if (
				disabledImports.has( id ) &&
				importer &&
				normalizePath( importer ).startsWith( packageDirectory )
			) {
				return EMPTY_MODULE_ID;
			}
		},
		load( id ) {
			if ( id === EMPTY_MODULE_ID ) {
				// PostCSS probes these optional APIs. Honor its browser:false
				// mappings without Vite's warning-producing external proxies.
				return 'module.exports = {};';
			}
		},
	};
}
