import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import postcss from 'postcss';
import rtlcss from 'rtlcss';
import {
	type AsyncCompiler,
	type FileImporter,
	initAsyncCompiler,
	NodePackageImporter,
} from 'sass-embedded';
import type { Plugin } from 'vite';
import dsTokenFallbacks from '@wordpress/theme-build-tools/postcss-plugins/postcss-ds-token-fallbacks';

const ROOT_DIR = path.resolve( import.meta.dirname, '..' );
const PACKAGES_DIR = path.join( ROOT_DIR, 'packages' );
const BUILD_STYLE_IMPORT =
	/^@wordpress\/([^/]+)\/build-style\/(.+?)(-rtl)?\.css(\?.*)?$/;
const BUILD_STYLE_ID =
	/\/packages\/([^/]+)\/build-style\/(.+?)(-rtl)?\.css(\?.*)?$/;

/**
 * Find the Sass entry point a `build-style` stylesheet is compiled from.
 *
 * @param packageName Package directory name.
 * @param entry       Stylesheet path inside `build-style`, without `.css`.
 * @return Absolute path of the entry point, or `null`.
 */
function getStyleEntry( packageName: string, entry: string ): string | null {
	const file = path.join(
		PACKAGES_DIR,
		packageName,
		'src',
		`${ entry }.scss`
	);
	return existsSync( file ) ? file : null;
}

/*
 * Package stylesheets `@use` the built stylesheets of other packages, such as
 * `@wordpress/dataviews/build-style/style.css`. Compile those from source too.
 */
const buildStyleImporter: FileImporter< 'async' > = {
	findFileUrl( url ) {
		const match = url.match( BUILD_STYLE_IMPORT );
		const file =
			match && ! match[ 3 ] && getStyleEntry( match[ 1 ], match[ 2 ] );
		return file ? pathToFileURL( file ) : null;
	},
};

/**
 * Compile package stylesheets from source instead of reading
 * `build-style`.
 *
 * Imports of `@wordpress/<package>/build-style/<entry>.css` and
 * `<entry>-rtl.css` compile `src/<entry>.scss` the way the package build
 * does, so Storybook needs no package build and reloads on stylesheet edits.
 * A stylesheet without a Sass source resolves to the built file as usual.
 *
 * @return Vite plugin.
 */
export function packageStylesPlugin(): Plugin {
	let compilerPromise: Promise< AsyncCompiler > | undefined;
	// Sass files the compiled package stylesheets were built from.
	const sources = new Set< string >();

	const compile = async ( file: string, packageDir: string ) => {
		compilerPromise ??= initAsyncCompiler();
		const compiler = await compilerPromise;
		return compiler.compileAsync( file, {
			importers: [
				buildStyleImporter,
				new NodePackageImporter( packageDir ),
			],
			loadPaths: [
				path.join( packageDir, 'node_modules' ),
				path.join( ROOT_DIR, 'node_modules' ),
				path.join( PACKAGES_DIR, 'base-styles' ),
			],
			sourceMap: false,
		} );
	};

	const dispose = async () => {
		const pending = compilerPromise;
		compilerPromise = undefined;
		await ( await pending )?.dispose();
	};

	return {
		name: 'wordpress-package-styles',
		enforce: 'pre',
		resolveId( id, importer ) {
			const match =
				id.match( BUILD_STYLE_IMPORT ) ??
				( id.startsWith( '.' ) && importer
					? path
							.resolve( path.dirname( importer ), id )
							.match( BUILD_STYLE_ID )
					: null );
			if ( ! match || ! getStyleEntry( match[ 1 ], match[ 2 ] ) ) {
				return null;
			}
			const [ , packageName, entry, rtl = '', query = '' ] = match;
			return path.join(
				PACKAGES_DIR,
				packageName,
				'build-style',
				`${ entry }${ rtl }.css${ query }`
			);
		},
		async load( id ) {
			const match = id.match( BUILD_STYLE_ID );
			const file = match && getStyleEntry( match[ 1 ], match[ 2 ] );
			if ( ! match || ! file ) {
				return null;
			}

			const [ , packageName, , rtl, query = '' ] = match;
			const result = await compile(
				file,
				path.join( PACKAGES_DIR, packageName )
			);
			for ( const url of result.loadedUrls ) {
				if ( url.protocol === 'file:' ) {
					const source = fileURLToPath( url );
					sources.add( source );
					this.addWatchFile( source );
				}
			}

			let { css } = result;
			if ( rtl ) {
				css = (
					await postcss( [ rtlcss() ] ).process( css, {
						from: undefined,
					} )
				).css;
			}

			// Vite processes the stylesheet further, except for raw imports.
			if ( new URLSearchParams( query.slice( 1 ) ).has( 'raw' ) ) {
				css = (
					await postcss( [ dsTokenFallbacks ] ).process( css, {
						from: undefined,
					} )
				).css;
				return `export default ${ JSON.stringify( css ) };`;
			}
			return css;
		},
		/*
		 * Package stylesheets reach stories through decorators, which a hot
		 * update does not run again, so reload the preview instead.
		 */
		handleHotUpdate( { file, server } ) {
			if ( ! sources.has( file ) ) {
				return;
			}
			server.ws.send( { type: 'full-reload' } );
			return [];
		},
		configureServer( server ) {
			server.httpServer?.once( 'close', dispose );
		},
		closeBundle: dispose,
	};
}
