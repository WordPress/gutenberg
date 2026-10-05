import { expect, test } from 'vitest';
import { readNpmPackResult } from './read-npm-pack-result.mjs';

const result = { name: 'test-package', filename: 'test-package-1.0.0.tgz' };

test.each( [
	[ 'an array, as npm v11 returns', [ result ] ],
	[
		'an object keyed by name, as npm v12 returns',
		{ 'test-package': result },
	],
] )( 'reads %s', ( _description, output ) => {
	expect(
		readNpmPackResult( JSON.stringify( output ), 'test-package' )
	).toEqual( result );
} );

test.each( [
	[ 'no results', '[]', 0 ],
	[ 'more than one result', JSON.stringify( [ result, result ] ), 2 ],
] )( 'fails on %s', ( _description, stdout, count ) => {
	expect( () => readNpmPackResult( stdout, 'test-package' ) ).toThrow(
		`Expected one npm pack result for test-package, got ${ count }.`
	);
} );

test( 'fails on output that is not JSON', () => {
	expect( () =>
		readNpmPackResult( 'npm warn something', 'test-package' )
	).toThrow( 'Could not parse npm pack output for test-package' );
} );
