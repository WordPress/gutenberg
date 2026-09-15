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

const DIMMED_OPACITY = 0.25;

// One entry per path, holding its opacity as a number, or undefined where the
// path carries no opacity at all.
const readPathOpacities = ( slug ) => {
	const svg = readFileSync(
		path.join( LIBRARY_DIR, `${ slug }.svg` ),
		'utf8'
	);

	return ( svg.match( /<path\b[^>]*\/>/g ) ?? [] ).map( ( element ) => {
		const opacity = element.match( /\sopacity="([^"]*)"/ )?.[ 1 ];
		return opacity === undefined ? undefined : Number.parseFloat( opacity );
	} );
};

describe( 'side and corner highlight icons', () => {
	it.each( HIGHLIGHT_ICONS )(
		`%s dims one of its two paths to ${ DIMMED_OPACITY }`,
		( slug ) => {
			const opacities = readPathOpacities( slug );

			expect( opacities ).toHaveLength( 2 );
			expect(
				opacities.filter( ( value ) => value !== undefined )
			).toEqual( [ DIMMED_OPACITY ] );
		}
	);

	// The "all" variants highlight the whole box, so they have nothing to dim.
	it.each( [ 'corner-all', 'sides-all' ] )(
		'%s draws a single undimmed path',
		( slug ) => {
			expect( readPathOpacities( slug ) ).toEqual( [ undefined ] );
		}
	);
} );
