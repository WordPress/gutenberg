/**
 * Keeps `fixtures/overlaps/generated/` in step with the fixtures and the
 * oracle. After changing either, regenerate with:
 *
 *     UPDATE_OVERLAP_FIXTURES=1 npm run test:unit -- packages/editor/src/components/inline-suggestions/test/overlap-fixtures-generated.ts
 */
import { describe, expect, it } from 'vitest';
import { FIXTURES } from './fixtures/overlaps';
import { generateFixtureData } from './fixtures/overlap-generated';

const DIRECTORY =
	'packages/editor/src/components/inline-suggestions/test/fixtures/overlaps/generated';

/**
 * Node's file system module, loaded at run time: the editor's type check has
 * no Node types.
 */
async function fileSystem(): Promise< any > {
	const name = 'node:fs';
	return import( /* @vite-ignore */ name );
}

describe( 'generated overlap fixture data', () => {
	it.each( FIXTURES.map( ( f ) => [ f.name, f ] as const ) )(
		'%s is up to date',
		async ( name, fixture ) => {
			const fs = await fileSystem();
			const path = `${ DIRECTORY }/${ name }.json`;
			const expected = generateFixtureData( fixture );
			if ( process.env.UPDATE_OVERLAP_FIXTURES ) {
				fs.mkdirSync( DIRECTORY, { recursive: true } );
				fs.writeFileSync(
					path,
					JSON.stringify( expected, null, '\t' ) + '\n'
				);
			}
			// Compared parsed: the commit hook formats the files.
			expect( JSON.parse( fs.readFileSync( path, 'utf8' ) ) ).toEqual(
				expected
			);
		}
	);
} );
