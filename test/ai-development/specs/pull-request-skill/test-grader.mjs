/**
 * Unit tests for the deterministic PR description grader — run these before
 * spending agent tokens on a live eval. Each case pairs a canned PR
 * description with the components it must fail.
 *
 *   npm run test:grader
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire( import.meta.url );
const specDir = path.dirname( fileURLToPath( import.meta.url ) );
const { gradePrDescription } = require(
	path.join( specDir, 'grade-pr-description.cjs' )
);

const fixture = ( name ) =>
	fs.readFileSync( path.join( specDir, 'fixtures', name ), 'utf8' );

/**
 * Names of the components the grader reported as failing.
 *
 * @param {string} output PR description markdown.
 * @return {string[]} Sorted failing component labels.
 */
function failingComponents( output ) {
	const result = gradePrDescription( output );
	return result.componentResults
		.filter( ( component ) => ! component.pass )
		.map( ( component ) => component.reason.split( ':' )[ 0 ] )
		.sort();
}

const cases = [
	{
		name: 'a well-formed description passes every component',
		output: () => fixture( 'good.md' ),
		expectFailing: [],
	},
	{
		name: 'a vague file inventory has no template sections or disclosure',
		output: () => fixture( 'bad-file-inventory.md' ),
		expectFailing: [ 'AI disclosure', 'Template sections' ],
	},
	{
		name: 'a bare "None." does not count as an AI disclosure',
		output: () => fixture( 'bad-boilerplate.md' ),
		expectFailing: [ 'AI disclosure' ],
	},
	{
		name: 'template sections out of order fail',
		output: () =>
			fixture( 'good.md' ).replace( /## Why\?[\s\S]*?(?=## How\?)/, '' ),
		expectFailing: [ 'Template sections' ],
	},
];

for ( const testCase of cases ) {
	test( testCase.name, () => {
		const output = testCase.output();
		assert.deepEqual( failingComponents( output ), testCase.expectFailing );
		assert.equal(
			gradePrDescription( output ).pass,
			testCase.expectFailing.length === 0
		);
	} );
}
