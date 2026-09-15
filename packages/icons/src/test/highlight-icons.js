import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const LIBRARY_DIR = path.join(
	path.dirname( fileURLToPath( import.meta.url ) ),
	'..',
	'library'
);

/*
 * Icons that pick out one side or corner of a box. They draw the highlighted
 * part in one path and the rest of the box in a second, dimmed one. Without
 * the dimming every variant in the family renders as the same box, which is
 * what happened when these were redrawn as stroke icons in #82540.
 */
const HIGHLIGHT_ICONS = [
	'corner-bottom-left',
	'corner-bottom-right',
	'corner-top-left',
	'corner-top-right',
	'sides-bottom',
	'sides-horizontal',
	'sides-left',
	'sides-right',
	'sides-top',
	'sides-vertical',
];

describe( 'side and corner highlight icons', () => {
	it.each( HIGHLIGHT_ICONS )( '%s dims one of its two paths', ( slug ) => {
		const svg = readFileSync(
			path.join( LIBRARY_DIR, `${ slug }.svg` ),
			'utf8'
		);
		const paths = svg.match( /<path\b[^>]*\/>/g ) ?? [];

		expect( paths ).toHaveLength( 2 );
		expect(
			paths.filter( ( element ) => element.includes( 'opacity=' ) )
		).toHaveLength( 1 );
	} );

	// The "all" variants highlight the whole box, so they have nothing to dim.
	it.each( [ 'corner-all', 'sides-all' ] )(
		'%s draws a single undimmed path',
		( slug ) => {
			const svg = readFileSync(
				path.join( LIBRARY_DIR, `${ slug }.svg` ),
				'utf8'
			);
			const paths = svg.match( /<path\b[^>]*\/>/g ) ?? [];

			expect( paths ).toHaveLength( 1 );
			expect( paths[ 0 ] ).not.toContain( 'opacity=' );
		}
	);
} );
