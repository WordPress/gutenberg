import { afterEach, describe, expect, it } from 'vitest';
import { getClosestTrack, getGridTracks, getTrackRange } from '../utils';
import type { GridTrack } from '../types';

describe( 'grid track measurements', () => {
	let grid: HTMLDivElement;

	afterEach( () => {
		grid.remove();
	} );

	function createGrid(
		columns: number[],
		template = 'repeat(auto-fit, minmax(100px, 1fr))'
	) {
		grid = document.createElement( 'div' );
		Object.assign( grid.style, {
			display: 'grid',
			width: '500px',
			columnGap: '20px',
			gridTemplateColumns: template,
		} );
		const items = columns.map( ( column ) => {
			const element = document.createElement( 'div' );
			element.style.gridColumn = String( column );
			element.textContent = `Column ${ column }`;
			grid.append( element );
			return { column, element };
		} );
		document.body.append( grid );
		return items;
	}

	function expectTracksToMatchItems(
		tracks: GridTrack[],
		items: ReturnType< typeof createGrid >
	) {
		const gridLeft = grid.getBoundingClientRect().left;
		for ( const { column, element } of items ) {
			const bounds = element.getBoundingClientRect();
			const start = bounds.left - gridLeft;
			const end = bounds.right - gridLeft;
			expect( tracks[ column - 1 ].start ).toBeCloseTo( start );
			expect( tracks[ column - 1 ].end ).toBeCloseTo( end );
			// Resizing snaps the item's edges to the closest track.
			expect( getClosestTrack( tracks, start ) ).toBe( column - 1 );
			expect( getClosestTrack( tracks, end, 'end' ) ).toBe( column - 1 );
			// Movers locate the same item through its overlapped track range.
			expect( getTrackRange( tracks, start, end ) ).toEqual( [
				column,
				column,
			] );
		}
	}

	it.each( [
		{ name: 'one collapsed column', columns: [ 1, 3, 4 ] },
		{ name: 'several collapsed columns', columns: [ 1, 4 ] },
	] )(
		'preserves one gutter across $name between occupied auto-fit columns',
		( { columns } ) => {
			const items = createGrid( columns );
			const tracks = getGridTracks( grid, 'column', {
				collapseEmptyTracks: true,
			} );
			expect( tracks[ columns[ 1 ] - 1 ].start - tracks[ 0 ].end ).toBe(
				20
			);
			expectTracksToMatchItems( tracks, items );
		}
	);

	it.each( [
		{ name: 'leading', columns: [ 3, 4 ] },
		{ name: 'trailing', columns: [ 1, 2 ] },
		{ name: 'leading and trailing', columns: [ 2, 3 ] },
	] )(
		'collapses outer gutters around $name empty auto-fit columns',
		( { columns } ) => {
			const items = createGrid( columns );
			const tracks = getGridTracks( grid, 'column', {
				collapseEmptyTracks: true,
			} );
			expect( tracks[ columns[ 0 ] - 1 ].start ).toBe( 0 );
			expect( tracks[ tracks.length - 1 ].end ).toBe( grid.clientWidth );
			expectTracksToMatchItems( tracks, items );
		}
	);

	it( 'preserves gutters around ordinary zero-width columns', () => {
		const items = createGrid( [ 1, 4 ], '240px 0px 0px 240px' );
		const tracks = getGridTracks( grid, 'column' );
		expect( tracks[ 3 ].start ).toBe( 300 );
		expectTracksToMatchItems( tracks, items );
	} );
} );
