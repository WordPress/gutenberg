import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { createLineTransform } from '../typecheck-helpers.mjs';

const FIXTURES_DIR = path.join(
	path.dirname( fileURLToPath( import.meta.url ) ),
	'fixtures'
);

const ANSI = /\u001B\[[0-9;]*m/g;
const CYAN = '\u001B[96m';
const RESET = '\u001B[0m';

/**
 * Runs a captured `tsc --build --verbose` log through the transform, the way
 * the script feeds it one readline line at a time.
 *
 * @param {string}  fixture  File name under `fixtures`.
 * @param {boolean} verbatim Whether `--verbose` was asked for.
 * @return {string[]} The lines the script would have printed.
 */
function transformFixture( fixture, verbatim = false ) {
	const transform = createLineTransform( verbatim );
	const lines = readFileSync(
		path.join( FIXTURES_DIR, fixture ),
		'utf8'
	).split( '\n' );

	// The trailing newline ends the last line rather than starting another.
	if ( lines.at( -1 ) === '' ) {
		lines.pop();
	}

	return lines
		.map( ( line ) => transform( line ) )
		.filter( ( line ) => line !== null );
}

describe.each( [
	[ 'pretty', 'tsc-verbose-pretty.txt', true ],
	[ 'plain', 'tsc-verbose-plain.txt', false ],
] )( '%s tsc output', ( _label, fixture, colored ) => {
	test( 'names the project behind a diagnostic placed on no file', () => {
		const unplaced = transformFixture( fixture ).filter( ( line ) =>
			line.includes( 'TS2688' )
		);

		expect( unplaced.length ).toBeGreaterThan( 0 );
		unplaced.forEach( ( line ) => {
			const [ name ] = line.split( ' - ' );
			const project = name.replace( ANSI, '' );

			expect( project ).toMatch( /^packages\/\w+\/tsconfig\.json$/ );
			// tsc colors nothing under `--pretty false`, so neither does this.
			expect( name ).toBe(
				colored ? `${ CYAN }${ project }${ RESET }` : project
			);
		} );
	} );

	test( 'leaves a file-located diagnostic alone', () => {
		const placed = transformFixture( fixture ).filter( ( line ) =>
			line.includes( 'TS2322' )
		);

		expect( placed.length ).toBeGreaterThan( 0 );
		placed.forEach( ( line ) => {
			expect( line.replace( ANSI, '' ) ).toMatch(
				/^packages\/blob\/src\/test\/index\.jsdom\.test\.ts[(:]94/
			);
		} );
	} );

	test( 'drops the bookkeeping `--verbose` adds', () => {
		const text = transformFixture( fixture )
			.map( ( line ) => line.replace( ANSI, '' ) )
			.join( '\n' );

		expect( text ).not.toMatch( /Projects in this build/ );
		expect( text ).not.toMatch( /^\s+\* .+\.json$/m );
		expect( text ).not.toMatch( /Building project/ );
		expect( text ).not.toMatch( /is (?:up to date|out of date)/ );
	} );

	test( 'keeps the bookkeeping when `--verbose` was asked for', () => {
		const text = transformFixture( fixture, true )
			.map( ( line ) => line.replace( ANSI, '' ) )
			.join( '\n' );

		expect( text ).toContain( 'Projects in this build' );
		expect( text ).toContain(
			"Building project 'packages/a11y/tsconfig.json'..."
		);
	} );
} );

test( 'attributes each diagnostic to the project being built', () => {
	const text = transformFixture( 'tsc-verbose-pretty.txt' )
		.map( ( line ) => line.replace( ANSI, '' ) )
		.join( '\n' );

	expect( text ).toContain(
		"packages/a11y/tsconfig.json - error TS2688: Cannot find type definition file for 'does-not-exist'."
	);
	expect( text ).toContain(
		"packages/abilities/tsconfig.json - error TS2688: Cannot find type definition file for 'does-not-exist'."
	);
} );
