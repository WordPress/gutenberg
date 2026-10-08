import { describe, expect, it } from 'vitest';
import { getAlignmentGuides } from '../get-alignment-guides';

const container = { left: 0, top: 0, right: 300, bottom: 300 };

function rect( left, top, width, height ) {
	return { left, top, right: left + width, bottom: top + height };
}

function byKind( guides, kind ) {
	return guides.filter( ( guide ) => guide.kind === kind );
}

describe( 'getAlignmentGuides()', () => {
	it( 'returns no guides when nothing lines up', () => {
		expect(
			getAlignmentGuides( {
				target: rect( 20, 20, 50, 50 ),
				siblings: [ rect( 200, 200, 30, 30 ) ],
				container,
			} )
		).toEqual( [] );
	} );

	it( 'draws container edge guides for touching edges', () => {
		const guides = getAlignmentGuides( {
			target: rect( 0, 0, 50, 50 ),
			container,
		} );
		expect( guides ).toEqual( [
			{
				orientation: 'vertical',
				position: 0,
				start: 0,
				end: 300,
				kind: 'container-edge',
			},
			{
				orientation: 'horizontal',
				position: 0,
				start: 0,
				end: 300,
				kind: 'container-edge',
			},
		] );
	} );

	it( 'draws container centre guides', () => {
		const guides = getAlignmentGuides( {
			target: rect( 100, 125, 100, 50 ),
			container,
		} );
		expect( byKind( guides, 'container-centre' ) ).toEqual( [
			{
				orientation: 'vertical',
				position: 150,
				start: 0,
				end: 300,
				kind: 'container-centre',
			},
			{
				orientation: 'horizontal',
				position: 150,
				start: 0,
				end: 300,
				kind: 'container-centre',
			},
		] );
	} );

	it( 'draws a sibling guide spanning both rectangles', () => {
		const guides = getAlignmentGuides( {
			target: rect( 40, 200, 50, 50 ),
			siblings: [ rect( 40, 20, 80, 30 ) ],
			container,
		} );
		expect( byKind( guides, 'sibling' ) ).toEqual( [
			{
				orientation: 'vertical',
				position: 40,
				start: 20,
				end: 250,
				kind: 'sibling',
			},
		] );
	} );

	it( 'only draws a guide to the nearest matching sibling', () => {
		const guides = getAlignmentGuides( {
			target: rect( 40, 200, 50, 50 ),
			siblings: [ rect( 40, 10, 20, 20 ), rect( 40, 120, 20, 20 ) ],
			container,
		} );
		expect( byKind( guides, 'sibling' ) ).toEqual( [
			{
				orientation: 'vertical',
				position: 40,
				start: 120,
				end: 250,
				kind: 'sibling',
			},
		] );
	} );

	it( 'matches centres against sibling edges', () => {
		const guides = getAlignmentGuides( {
			target: rect( 210, 40, 40, 40 ),
			siblings: [ rect( 20, 60, 100, 100 ) ],
			container,
		} );
		expect( byKind( guides, 'sibling' ) ).toEqual( [
			{
				orientation: 'horizontal',
				position: 60,
				start: 20,
				end: 250,
				kind: 'sibling',
			},
		] );
	} );

	it( 'treats lines within the tolerance as matching', () => {
		expect(
			byKind(
				getAlignmentGuides( {
					target: rect( 40.6, 200, 50, 50 ),
					siblings: [ rect( 40, 20, 80, 30 ) ],
					container,
				} ),
				'sibling'
			)
		).toHaveLength( 1 );
		expect(
			byKind(
				getAlignmentGuides( {
					target: rect( 42, 200, 50, 50 ),
					siblings: [ rect( 40, 20, 80, 30 ) ],
					container,
				} ),
				'sibling'
			)
		).toHaveLength( 0 );
	} );

	it( 'draws at most one sibling guide per landing line', () => {
		const guides = getAlignmentGuides( {
			target: rect( 100, 100, 100, 100 ),
			siblings: [
				rect( 100, 0, 100, 50 ),
				rect( 100, 250, 100, 50 ),
				rect( 0, 100, 50, 100 ),
				rect( 250, 100, 50, 100 ),
			],
			container: { left: -1000, top: -1000, right: 1000, bottom: 1001 },
		} );
		const siblingGuides = byKind( guides, 'sibling' );
		expect(
			siblingGuides.filter( ( g ) => g.orientation === 'vertical' )
		).toHaveLength( 3 );
		expect(
			siblingGuides.filter( ( g ) => g.orientation === 'horizontal' )
		).toHaveLength( 3 );
	} );
} );
