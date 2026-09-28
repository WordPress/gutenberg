import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { globSync } from 'glob';
import { mkdirpSync } from 'mkdirp';
import { rimrafSync } from 'rimraf';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import webpack from 'webpack';

const require = createRequire( import.meta.url );
const currentDirectory = path.dirname( fileURLToPath( import.meta.url ) );

describe( 'ReadableJsAssetsWebpackPlugin', () => {
	const outputDirectory = path.join( currentDirectory, 'build' );
	const testDirectory = path.join( currentDirectory, 'fixtures' );

	beforeEach( () => {
		rimrafSync( outputDirectory );
		mkdirpSync( outputDirectory );
	} );

	// This afterEach is necessary to prevent watched tests from retriggering on every run.
	afterEach( () => rimrafSync( outputDirectory ) );

	test( 'should produce the expected output', async () => {
		await new Promise( ( resolve ) => {
			const options = Object.assign(
				{
					context: testDirectory,
				},
				require( path.join( testDirectory, 'webpack.config.js' ) )
			);
			options.output.path = outputDirectory;

			webpack( options, ( err ) => {
				expect( err ).toBeNull();

				const assetFiles = globSync( '*.js', {
					cwd: outputDirectory,
					absolute: true,
				} ).sort();

				expect( assetFiles ).toHaveLength( 4 );

				// Asset files should match.
				assetFiles.forEach( ( assetFile ) => {
					expect(
						fs.readFileSync( assetFile, 'utf-8' )
					).toMatchSnapshot(
						`Asset file ${ path.relative(
							outputDirectory,
							assetFile
						) } should match snapshot`
					);
				} );

				resolve();
			} );
		} );
	} );
} );
