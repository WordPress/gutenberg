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

import * as esbuild from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );

const sharedExternal = [ 'react', 'react-dom', 'react/jsx-runtime' ];

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

		// IIFE build for wp-env (exposes window.OverlayBundleA / B)
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
			define: {
				'process.env.NODE_ENV': '"production"',
			},
			platform: 'browser',
			target: 'es2020',
			minify: false,
			sourcemap: true,
		} );

		// ESM build for Storybook (also lives in build/ — Storybook uses a Vite alias)
		await esbuild.build( {
			entryPoints: [ entryPoint ],
			bundle: true,
			format: 'esm',
			outfile: path.resolve(
				esmOutDir,
				`bundle-${ entry.name }.esm.js`
			),
			external: sharedExternal,
			define: {
				'process.env.NODE_ENV': '"production"',
			},
			platform: 'browser',
			target: 'es2020',
			minify: false,
			sourcemap: true,
		} );
	}

	// Playground IIFE build for wp-env admin page
	await esbuild.build( {
		entryPoints: [
			path.resolve( __dirname, 'src/playground.tsx' ),
		],
		bundle: true,
		format: 'iife',
		outfile: path.resolve( __dirname, 'build/playground.iife.js' ),
		external: [ ...sharedExternal ],
		define: {
			'process.env.NODE_ENV': '"production"',
		},
		platform: 'browser',
		target: 'es2020',
		minify: false,
		sourcemap: true,
		jsx: 'automatic',
		jsxImportSource: 'react',
	} );

	console.log( 'Built cross-bundle overlay stress test bundles:' );
	console.log( '  IIFE + ESM: packages/e2e-tests/plugins/overlay-dismiss-stress-test/build/' );
}

build().catch( ( err ) => {
	console.error( err );
	process.exit( 1 );
} );
