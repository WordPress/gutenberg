/**
 * Build script for the cross-bundle overlay dismiss stress test.
 *
 * Produces two independent bundles from @base-ui/react, each with its own
 * React.createContext() instances. Both bundles externalize react/react-dom
 * so they share the same React instance at runtime — exactly what wp-build
 * does for wpScript: true packages.
 *
 * Outputs:
 *   - IIFE bundles (for wp-env): window.OverlayBundleA / window.OverlayBundleB
 *   - ESM bundles (for Storybook): importable ES modules
 */

// eslint-disable-next-line import/no-extraneous-dependencies
import * as esbuild from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );

const sharedExternal = [ 'react', 'react-dom', 'react/jsx-runtime' ];

/**
 * CJS dependencies (e.g. use-sync-external-store) call require('react') at
 * runtime. esbuild wraps these in a __require shim that throws in contexts
 * where `require` is not defined. These banners provide a minimal require()
 * that maps externalized packages to their runtime locations.
 */
const iifeBanner = [
	'var require = (function(g) { return function(m) {',
	'  if (m === "react") return g.React;',
	'  if (m === "react-dom") return g.ReactDOM;',
	'  if (m === "react/jsx-runtime") return g.ReactJSXRuntime;',
	'  throw new Error("Unexpected require: " + m);',
	'}; })(globalThis);',
].join( '\n' );

const esmBanner = [
	'import * as __react from "react";',
	'import * as __reactDom from "react-dom";',
	'import * as __reactJsx from "react/jsx-runtime";',
	'var require = (m) => {',
	'  if (m === "react") return __react;',
	'  if (m === "react-dom") return __reactDom;',
	'  if (m === "react/jsx-runtime") return __reactJsx;',
	'  throw new Error("Unexpected require: " + m);',
	'};',
].join( '\n' );

const entries = [
	{ name: 'a', globalName: 'OverlayBundleA' },
	{ name: 'b', globalName: 'OverlayBundleB' },
];

const esmOutDir = path.resolve( __dirname, 'build' );

async function build() {
	for ( const entry of entries ) {
		const entryPoint = path.resolve(
			__dirname,
			`src/entry-${ entry.name }.ts`
		);

		await esbuild.build( {
			entryPoints: [ entryPoint ],
			bundle: true,
			format: 'iife',
			globalName: entry.globalName,
			outfile: path.resolve(
				__dirname,
				`build/bundle-${ entry.name }.iife.js`
			),
			external: sharedExternal,
			define: { 'process.env.NODE_ENV': '"production"' },
			platform: 'browser',
			target: 'es2020',
			minify: false,
			sourcemap: true,
			banner: { js: iifeBanner },
		} );

		await esbuild.build( {
			entryPoints: [ entryPoint ],
			bundle: true,
			format: 'esm',
			outfile: path.resolve( esmOutDir, `bundle-${ entry.name }.esm.js` ),
			external: sharedExternal,
			define: { 'process.env.NODE_ENV': '"production"' },
			platform: 'neutral',
			mainFields: [ 'module', 'main' ],
			target: 'es2020',
			minify: false,
			sourcemap: true,
			banner: { js: esmBanner },
		} );
	}

	await esbuild.build( {
		entryPoints: [ path.resolve( __dirname, 'src/playground.tsx' ) ],
		bundle: true,
		format: 'iife',
		outfile: path.resolve( __dirname, 'build/playground.iife.js' ),
		external: [ ...sharedExternal ],
		define: { 'process.env.NODE_ENV': '"production"' },
		platform: 'browser',
		target: 'es2020',
		minify: false,
		sourcemap: true,
		jsx: 'automatic',
		jsxImportSource: 'react',
		banner: { js: iifeBanner },
	} );

	// eslint-disable-next-line no-console
	console.log( 'Built cross-bundle overlay stress test bundles.' );
}

build().catch( ( err ) => {
	// eslint-disable-next-line no-console
	console.error( err );
	process.exit( 1 );
} );
