import { createRequire } from 'node:module';
import path from 'node:path';
import { normalizePath } from 'vite';

const EMPTY_MODULE_ID = '\0postcss-browser-empty';

// Temporary workaround for https://github.com/vitejs/vite/issues/23512.
// Remove this plugin and its optimizer registration once the installed Vite
// version handles browser:false imports without warnings. Keep the Browser
// regression test to verify removal.
//
// The separate CSS Modules missing-`from` warning is tracked in:
// https://github.com/madyankin/postcss-modules/pull/173
// https://github.com/vitejs/vite/issues/15410
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
