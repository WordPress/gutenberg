import { expect, test } from 'vitest';
import { readNpmPackResult } from './read-npm-pack-result.mjs';

const result = {
	name: 'test-package',
	filename: 'test-package-1.0.0.tgz',
	files: [ { path: 'package.json' } ],
};

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
	[ 'an empty array', '[]', 0 ],
	[ 'an array of several results', JSON.stringify( [ result, result ] ), 2 ],
	[ 'an object with no keys', '{}', 0 ],
	[
		'an object with several keys',
		JSON.stringify( { a: result, b: result } ),
		2,
	],
	[ 'null', 'null', 0 ],
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

test.each( [
	[ 'null', '[null]' ],
	[ 'a result without files', '[{"filename":"test-package-1.0.0.tgz"}]' ],
	[ 'a result without filename', '[{"files":[]}]' ],
] )( 'fails on %s', ( _description, stdout ) => {
	expect( () => readNpmPackResult( stdout, 'test-package' ) ).toThrow(
		'Unexpected npm pack result for test-package'
	);
} );
