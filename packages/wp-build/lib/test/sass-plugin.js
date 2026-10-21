import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import esbuild from 'esbuild';
import { initAsyncCompiler } from 'sass-embedded';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { disposeSassCompiler, sassPlugin } from '../sass-plugin.mjs';

vi.mock( import( 'sass-embedded' ), async ( importOriginal ) => {
	const actual = await importOriginal();
	return {
		...actual,
		initAsyncCompiler: vi.fn( actual.initAsyncCompiler ),
	};
} );

describe( 'sassPlugin', () => {
	let temporaryDirectory;

	beforeEach( () => {
		vi.mocked( initAsyncCompiler ).mockClear();
		temporaryDirectory = mkdtempSync(
			path.join( os.tmpdir(), 'wordpress-build-sass-plugin-' )
		);
		writeFileSync(
			path.join( temporaryDirectory, '_colors.scss' ),
			'$accent: #123456;\n'
		);
		writeFileSync(
			path.join( temporaryDirectory, 'style.scss' ),
			'@use "colors";\n.a { .b { color: colors.$accent; } }\n'
		);
		writeFileSync(
			path.join( temporaryDirectory, 'plain.css' ),
			'.c{color:red}\n'
		);
	} );

	afterEach( async () => {
		await disposeSassCompiler();
		rmSync( temporaryDirectory, { force: true, recursive: true } );
	} );

	/**
	 * Build the given files and return the CSS the plugin passed to
	 * `transform`, keyed by file name.
	 *
	 * @param {string[]} fileNames Entry points in the temporary directory.
	 * @return {Promise<Object<string, string>>} CSS by file name.
	 */
	async function build( fileNames ) {
		const css = {};
		await esbuild.build( {
			entryPoints: fileNames.map( ( fileName ) =>
				path.join( temporaryDirectory, fileName )
			),
			outdir: path.join( temporaryDirectory, 'out' ),
			bundle: true,
			write: false,
			logLevel: 'silent',
			plugins: [
				sassPlugin( {
					filter: /\.(css|scss)$/,
					loader: 'js',
					transform( source, _dirname, filePath ) {
						css[ path.basename( filePath ) ] = source;
						return '';
					},
				} ),
			],
		} );
		return css;
	}

	it( 'compiles Sass and passes plain CSS through unchanged', async () => {
		expect( await build( [ 'style.scss', 'plain.css' ] ) ).toEqual( {
			'style.scss': '.a .b {\n  color: #123456;\n}',
			'plain.css': '.c{color:red}\n',
		} );
	} );

	it( 'shares one compiler between builds until it is disposed', async () => {
		await Promise.all( [
			build( [ 'style.scss' ] ),
			build( [ 'style.scss' ] ),
		] );
		expect( initAsyncCompiler ).toHaveBeenCalledTimes( 1 );

		await disposeSassCompiler();
		await build( [ 'style.scss' ] );
		expect( initAsyncCompiler ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'does not start a compiler for plain CSS', async () => {
		await build( [ 'plain.css' ] );
		expect( initAsyncCompiler ).not.toHaveBeenCalled();
	} );
} );
