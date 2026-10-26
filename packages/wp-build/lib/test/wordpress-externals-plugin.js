import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import * as esbuild from 'esbuild';
import { expect, it, onTestFinished } from 'vitest';
import { createWordpressExternalsPlugin } from '../wordpress-externals-plugin.mjs';

async function buildAsFormat( format ) {
	const outdir = await mkdtemp( path.join( os.tmpdir(), 'wp-build-' ) );
	onTestFinished( () => rm( outdir, { recursive: true, force: true } ) );
	const plugin = createWordpressExternalsPlugin(
		undefined,
		undefined,
		{},
		undefined,
		{
			'@wordpress/ui': {
				module: 'my-plugin/wp-ui-0-1-2',
				handle: 'my-plugin-wp-ui-0-1-2',
				global: 'myPlugin.wpUi',
			},
		}
	);

	await esbuild.build( {
		stdin: {
			contents: `
import { Button } from '@wordpress/ui';
Button();
`,
		},
		bundle: true,
		format,
		outfile: path.join( outdir, 'index.min.js' ),
		plugins: [ plugin( 'index.min', format ) ],
	} );

	return {
		codeContent: await readFile(
			path.join( outdir, 'index.min.js' ),
			'utf8'
		),
		assetContent: await readFile(
			path.join( outdir, 'index.min.asset.php' ),
			'utf8'
		),
	};
}

it( 'imports an external package from its script module in ESM builds', async () => {
	const { codeContent, assetContent } = await buildAsFormat( 'esm' );

	expect( codeContent ).toBe( `// <stdin>
import { Button } from "my-plugin/wp-ui-0-1-2";
Button();
` );
	expect( assetContent ).toContain(
		"array('id' => 'my-plugin/wp-ui-0-1-2', 'import' => 'static')"
	);
} );

it( 'reads an external package from its global in classic builds', async () => {
	const { codeContent, assetContent } = await buildAsFormat( 'iife' );

	expect( codeContent ).toContain( 'module.exports = window.myPlugin.wpUi;' );
	expect( assetContent ).toContain(
		"'dependencies' => array('my-plugin-wp-ui-0-1-2')"
	);
} );
