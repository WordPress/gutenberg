import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import * as esbuild from 'esbuild';
import { describe, expect, it, onTestFinished } from 'vitest';
import { createWordpressExternalsPlugin } from '../wordpress-externals-plugin.mjs';

const UI_EXTERNAL = {
	module: 'my-plugin/wp-ui',
	handle: 'my-plugin-wp-ui',
	global: 'myPlugin.wpUi',
};

async function build( { externals, format, contents, external = [] } ) {
	const outdir = await mkdtemp( path.join( os.tmpdir(), 'wp-build-' ) );
	onTestFinished( () => rm( outdir, { recursive: true, force: true } ) );
	const plugin = createWordpressExternalsPlugin(
		undefined,
		undefined,
		{},
		undefined,
		externals
	);

	await esbuild.build( {
		stdin: { contents, resolveDir: outdir },
		bundle: true,
		format,
		external,
		logLevel: 'silent',
		outfile: path.join( outdir, 'index.min.js' ),
		plugins: [ plugin( 'index.min', format ) ],
	} );

	return {
		code: await readFile( path.join( outdir, 'index.min.js' ), 'utf8' ),
		asset: await readFile(
			path.join( outdir, 'index.min.asset.php' ),
			'utf8'
		),
	};
}

describe( 'wpPlugin.externals', () => {
	it( 'imports the package from its script module in script module builds', async () => {
		const { code, asset } = await build( {
			externals: { '@wordpress/ui': UI_EXTERNAL },
			format: 'esm',
			contents: `import { Button } from '@wordpress/ui'; Button();`,
		} );

		expect( code ).toContain( 'from "my-plugin/wp-ui"' );
		expect( asset ).toContain(
			"array('id' => 'my-plugin/wp-ui', 'import' => 'static')"
		);
	} );

	it( 'keeps dynamic imports as dynamic module dependencies', async () => {
		const { asset } = await build( {
			externals: { '@wordpress/ui': UI_EXTERNAL },
			format: 'esm',
			contents: `import( '@wordpress/ui' );`,
		} );

		expect( asset ).toContain(
			"array('id' => 'my-plugin/wp-ui', 'import' => 'dynamic')"
		);
	} );

	it( 'reads the package from its global in classic script builds', async () => {
		const { code, asset } = await build( {
			externals: { '@wordpress/ui': UI_EXTERNAL },
			format: 'iife',
			contents: `import { Button } from '@wordpress/ui'; Button();`,
		} );

		expect( code ).toContain( 'module.exports = window.myPlugin.wpUi;' );
		expect( asset ).toContain(
			"'dependencies' => array('my-plugin-wp-ui')"
		);
	} );

	it( 'replaces the default handle of a package that WordPress provides', async () => {
		const { code, asset } = await build( {
			externals: {
				'@wordpress/theme': {
					handle: 'my-plugin-wp-theme-2-0-0',
					global: 'myPlugin.wpTheme',
				},
			},
			format: 'iife',
			contents: `import { ThemeProvider } from '@wordpress/theme'; ThemeProvider();`,
		} );

		expect( code ).toContain( 'module.exports = window.myPlugin.wpTheme;' );
		expect( asset ).toContain(
			"'dependencies' => array('my-plugin-wp-theme-2-0-0')"
		);
	} );

	it( 'externalizes a subpath that has its own entry', async () => {
		const { code, asset } = await build( {
			externals: {
				'@wordpress/dataviews': { module: 'my-plugin/wp-dataviews' },
				'@wordpress/dataviews/wp': {
					module: 'my-plugin/wp-dataviews-wp',
				},
			},
			format: 'esm',
			contents: `import { DataViews } from '@wordpress/dataviews/wp'; DataViews();`,
		} );

		expect( code ).toContain( 'from "my-plugin/wp-dataviews-wp"' );
		expect( asset ).toContain(
			"array('id' => 'my-plugin/wp-dataviews-wp', 'import' => 'static')"
		);
		expect( asset ).not.toContain( "'my-plugin/wp-dataviews'" );
	} );

	it( 'fails the build for a subpath without its own entry', async () => {
		await expect(
			build( {
				externals: {
					'@wordpress/dataviews': {
						module: 'my-plugin/wp-dataviews',
					},
				},
				format: 'esm',
				contents: `import '@wordpress/dataviews/wp';`,
			} )
		).rejects.toThrow(
			'"@wordpress/dataviews/wp" is a subpath of "@wordpress/dataviews"'
		);
	} );

	it( 'fails the build when the entry does not support the build format', async () => {
		await expect(
			build( {
				externals: {
					'@wordpress/ui': { module: 'my-plugin/wp-ui' },
				},
				format: 'iife',
				contents: `import '@wordpress/ui';`,
			} )
		).rejects.toThrow( 'has no `handle` and `global`' );

		await expect(
			build( {
				externals: {
					'@wordpress/ui': {
						handle: 'my-plugin-wp-ui',
						global: 'myPlugin.wpUi',
					},
				},
				format: 'esm',
				contents: `import '@wordpress/ui';`,
			} )
		).rejects.toThrow( 'has no `module`' );
	} );

	it( 'matches import paths literally', async () => {
		const { code, asset } = await build( {
			externals: { 'lodash.debounce': { module: 'my-plugin/debounce' } },
			format: 'esm',
			contents: `import 'lodashXdebounce';`,
			external: [ 'lodashXdebounce' ],
		} );

		expect( code ).toContain( '"lodashXdebounce"' );
		expect( asset ).not.toContain( 'my-plugin/debounce' );
	} );

	it.each( [
		[ 'a non-object entry', { '@wordpress/ui': 'my-plugin-wp-ui' } ],
		[ 'an empty entry', { '@wordpress/ui': {} } ],
		[
			'a handle without a global',
			{ '@wordpress/ui': { handle: 'my-plugin-wp-ui' } },
		],
		[
			'a global that is not an identifier path',
			{
				'@wordpress/ui': {
					handle: 'my-plugin-wp-ui',
					global: 'myPlugin["wpUi"]',
				},
			},
		],
		[
			'a module ID that would break the asset file',
			{ '@wordpress/ui': { module: "my-plugin/wp-ui'" } },
		],
	] )( 'rejects %s', ( _, externals ) => {
		expect( () =>
			createWordpressExternalsPlugin(
				undefined,
				undefined,
				{},
				undefined,
				externals
			)
		).toThrow( 'wpPlugin.externals' );
	} );
} );
