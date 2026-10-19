import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import esbuild from 'esbuild';
import { expect, test } from 'vitest';
import { svgInlinePlugin } from '../svg-inline-plugin.mjs';

test( 'inlines an imported SVG as a data URI', async () => {
	const dir = await mkdtemp( path.join( tmpdir(), 'wp-build-svg-' ) );
	await mkdir( path.join( dir, 'src' ) );
	await writeFile( path.join( dir, 'src', 'a.svg' ), '<svg a="1"/>\n' );
	await writeFile(
		path.join( dir, 'src', 'index.js' ),
		"import a from './a.svg'; export default a;"
	);
	const { outputFiles } = await esbuild.build( {
		entryPoints: [ path.join( dir, 'src', 'index.js' ) ],
		bundle: true,
		format: 'esm',
		write: false,
		outdir: path.join( dir, 'out' ),
		plugins: [ svgInlinePlugin() ],
	} );
	expect( outputFiles[ 0 ].text ).toContain(
		`data:image/svg+xml,${ encodeURIComponent( '<svg a="1"/>' ) }`
	);
} );
