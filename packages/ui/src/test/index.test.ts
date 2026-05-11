import { join, dirname, basename } from 'node:path';
import { readFile } from 'node:fs/promises';
import glob from 'fast-glob';

describe( 'index', () => {
	it( 'should export something from each component', async () => {
		// As described in the CONTRIBUTING.md file, each component should be
		// exported from an index.ts in its implementation directory.
		const components = await glob( '*/index.ts', {
			cwd: join( __dirname, '..' ),
		} );
		const directories = components.map( ( c ) => basename( dirname( c ) ) );
		const index = await readFile(
			join( __dirname, '../index.ts' ),
			'utf-8'
		);

		for ( const directory of directories ) {
			expect( index ).toContain( `'./${ directory }'` );
		}
	} );
} );
