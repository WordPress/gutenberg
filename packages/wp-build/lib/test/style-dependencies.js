import { mkdir, mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { inferStyleDependencies } from '../style-dependencies.mjs';

async function writeJson( file, data ) {
	await mkdir( path.dirname( file ), { recursive: true } );
	await writeFile( file, JSON.stringify( data ) );
}

describe( 'inferStyleDependencies()', () => {
	let root;

	beforeEach( async () => {
		root = await mkdtemp( path.join( tmpdir(), 'wp-build-styles-' ) );
		await writeJson( path.join( root, 'package.json' ), { name: 'root' } );
		for ( const name of [ 'components', 'data' ] ) {
			await writeJson(
				path.join(
					root,
					'node_modules/@wordpress',
					name,
					'package.json'
				),
				{ name: `@wordpress/${ name }`, wpScript: true }
			);
		}
	} );

	afterEach( async () => {
		await rm( root, { recursive: true, force: true } );
	} );

	// A --no-script-debug build writes style.min.css but not style.css.
	it( 'keeps wpScript packages whose minified stylesheet was built', async () => {
		const buildDir = path.join( root, 'build' );
		await mkdir( path.join( buildDir, 'styles/components' ), {
			recursive: true,
		} );
		await writeFile(
			path.join( buildDir, 'styles/components/style.min.css' ),
			''
		);

		const deps = await inferStyleDependencies(
			[ 'react', 'wp-components', 'wp-data' ],
			{ resolveDir: root, buildDir }
		);

		expect( deps ).toEqual( [ 'wp-components' ] );
	} );
} );
