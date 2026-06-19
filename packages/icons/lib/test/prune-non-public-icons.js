/**
 * External dependencies
 */
import { mkdtemp, mkdir, writeFile, readdir, rm } from 'fs/promises';
import os from 'os';
import path from 'path';

/**
 * Internal dependencies
 */
import { pruneNonPublicIcons } from '../prune-non-public-icons.cjs';

describe( 'pruneNonPublicIcons', () => {
	let workDir;
	let libraryDir;
	let manifestPath;

	beforeEach( async () => {
		workDir = await mkdtemp( path.join( os.tmpdir(), 'icons-prune-' ) );
		libraryDir = path.join( workDir, 'library' );
		manifestPath = path.join( workDir, 'manifest.json' );
		await mkdir( libraryDir );

		for ( const name of [ 'public-a', 'public-b', 'private-c' ] ) {
			await writeFile(
				path.join( libraryDir, `${ name }.svg` ),
				'<svg/>'
			);
		}

		const manifest = [
			{
				slug: 'public-a',
				label: 'A',
				filePath: 'library/public-a.svg',
				public: true,
			},
			{
				slug: 'public-b',
				label: 'B',
				filePath: 'library/public-b.svg',
				public: true,
			},
			{
				slug: 'private-c',
				label: 'C',
				filePath: 'library/private-c.svg',
			},
		];
		await writeFile( manifestPath, JSON.stringify( manifest ) );
	} );

	afterEach( async () => {
		await rm( workDir, { recursive: true, force: true } );
	} );

	it( 'deletes non-public SVGs and keeps public ones', async () => {
		const result = await pruneNonPublicIcons( {
			libraryDir,
			manifestPath,
		} );

		const remaining = ( await readdir( libraryDir ) ).sort();
		expect( remaining ).toEqual( [ 'public-a.svg', 'public-b.svg' ] );
		expect( result ).toEqual( { pruned: 1, retained: 2 } );
		expect( console ).toHaveLoggedWith(
			'Pruned 1 non-public icon(s); 2 retained.'
		);
	} );
} );
