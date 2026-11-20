import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { build } from 'rolldown';
import { describe, expect, it, onTestFinished } from 'vitest';
import { createWordpressExternalsPlugin } from '../wordpress-externals-plugin.mjs';

const ENTRY = '\0entry';

// `@my-plugin/data` is not installed: the build only resolves it as an external.
const entryPlugin = {
	name: 'entry',
	resolveId: ( id ) => ( id === ENTRY ? id : null ),
	load: ( id ) =>
		id === ENTRY
			? "import { select } from '@my-plugin/data';\nselect();\n"
			: null,
};

async function buildAsFormat( format ) {
	const outputDir = await mkdtemp(
		path.join( os.tmpdir(), 'wp-build-externals-' )
	);
	onTestFinished( () => rm( outputDir, { recursive: true, force: true } ) );

	const externalsPlugin = createWordpressExternalsPlugin(
		undefined,
		undefined,
		{},
		undefined,
		{
			'@my-plugin/data': {
				handle: 'my-plugin-data',
				global: 'myPlugin.data',
			},
		}
	);

	await build( {
		input: ENTRY,
		plugins: [ entryPlugin, externalsPlugin( 'index.min', format ) ],
		output: {
			file: path.join( outputDir, 'index.min.js' ),
			format,
			codeSplitting: false,
		},
	} );

	return {
		code: await readFile( path.join( outputDir, 'index.min.js' ), 'utf8' ),
		asset: await readFile(
			path.join( outputDir, 'index.min.asset.php' ),
			'utf8'
		),
	};
}

describe( 'externals', () => {
	it.each( [ 'esm', 'iife' ] )(
		'reads the package from its script global in a %s build',
		async ( format ) => {
			const { code, asset } = await buildAsFormat( format );

			expect( code ).toContain( 'window.myPlugin.data' );
			expect( code ).not.toMatch( /from\s*["']@my-plugin\/data["']/ );
			expect( asset ).toContain(
				"'dependencies' => array('my-plugin-data')"
			);
		}
	);
} );
