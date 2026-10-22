import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import * as esbuild from 'esbuild';
import { expect, it, onTestFinished } from 'vitest';
import { createWordpressExternalsPlugin } from '../wordpress-externals-plugin.mjs';

it( 'imports an external package from its script module in ESM builds', async () => {
	const outdir = await mkdtemp( path.join( os.tmpdir(), 'wp-build-' ) );
	onTestFinished( () => rm( outdir, { recursive: true, force: true } ) );
	const plugin = createWordpressExternalsPlugin(
		undefined,
		undefined,
		{},
		undefined,
		{ '@wordpress/ui': { module: 'my-plugin/wp-ui-0-1-2' } }
	);

	await esbuild.build( {
		stdin: {
			contents: `
import { Button } from '@wordpress/ui';
Button();
`,
		},
		bundle: true,
		format: 'esm',
		outfile: path.join( outdir, 'index.min.js' ),
		plugins: [ plugin( 'index.min', 'esm' ) ],
	} );

	expect( await readFile( path.join( outdir, 'index.min.js' ), 'utf8' ) )
		.toBe( `
// <stdin>
import { Button } from "my-plugin/wp-ui-0-1-2";
Button();
` );
	expect(
		await readFile( path.join( outdir, 'index.min.asset.php' ), 'utf8' )
	).toContain(
		"array('id' => 'my-plugin/wp-ui-0-1-2', 'import' => 'static')"
	);
} );
