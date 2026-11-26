import { afterEach, describe, expect, it, vi } from 'vitest';
import { getGridItemMeasurements } from '../utils';
import { getRotatedBoundingRect } from '../../../utils/rotation';

interface ChildBox {
	clientId: string;
	left: number;
	top: number;
	width: number;
	height: number;
	rotate?: string;
}

// Three 100px columns and two 100px rows, with 10px gaps.
const GRID_CSS: Record< string, string > = {
	'grid-template-columns': '100px 100px 100px',
	'column-gap': '10px',
	'grid-template-rows': '100px 100px',
	'row-gap': '10px',
	'padding-left': '0px',
	'padding-top': '0px',
};

function setUpGrid( children: ChildBox[] ) {
	const grid = document.createElement( 'div' );
	const rotations = new Map< Element, string >();
	for ( const box of children ) {
		const child = document.createElement( 'div' );
		child.setAttribute( 'data-block', box.clientId );
		Object.defineProperties( child, {
			offsetParent: { get: () => grid },
			offsetLeft: { get: () => box.left },
			offsetTop: { get: () => box.top },
			offsetWidth: { get: () => box.width },
			offsetHeight: { get: () => box.height },
		} );
		grid.appendChild( child );
		if ( box.rotate ) {
			rotations.set( child, box.rotate );
		}
	}
	document.body.appendChild( grid );
	const gridReads = { count: 0 };
	vi.spyOn( window, 'getComputedStyle' ).mockImplementation( ( element ) => {
		if ( element === grid ) {
			gridReads.count++;
		}
		return {
			getPropertyValue: ( property: string ) => {
				if ( element === grid ) {
					return GRID_CSS[ property ] ?? '';
				}
				return property === 'rotate'
					? ( rotations.get( element ) ?? 'none' )
					: '';
			},
		} as CSSStyleDeclaration;
	} );
	return { grid, gridReads };
}

function cells( rect: {
	columnStart: number;
	rowStart: number;
	columnSpan: number;
	rowSpan: number;
} ) {
	const { columnStart, rowStart, columnSpan, rowSpan } = rect;
	return { columnStart, rowStart, columnSpan, rowSpan };
}

afterEach( () => {
	vi.restoreAllMocks();
	document.body.innerHTML = '';
} );

describe( 'getGridItemMeasurements()', () => {
	const children: ChildBox[] = [
		{ clientId: 'a', left: 0, top: 0, width: 100, height: 100 },
		{ clientId: 'b', left: 110, top: 110, width: 100, height: 100 },
		{ clientId: 'dragged', left: 220, top: 0, width: 100, height: 210 },
	];

	it( 'measures every visible child except the dragged one as a sibling', () => {
		const { grid } = setUpGrid( children );

		const { siblings, src } = getGridItemMeasurements( grid, 'dragged' );

		expect( siblings.map( ( { rect } ) => cells( rect ) ) ).toEqual( [
			{ columnStart: 1, rowStart: 1, columnSpan: 1, rowSpan: 1 },
			{ columnStart: 2, rowStart: 2, columnSpan: 1, rowSpan: 1 },
		] );
		expect( src && cells( src.rect ) ).toEqual( {
			columnStart: 3,
			rowStart: 1,
			columnSpan: 1,
			rowSpan: 2,
		} );
		expect( src?.pixelRect ).toEqual( {
			left: 220,
			top: 0,
			right: 320,
			bottom: 210,
		} );
	} );

	it( 'reads the grid padding once, however many children it has', () => {
		const { grid: smallGrid, gridReads: smallReads } =
			setUpGrid( children );
		getGridItemMeasurements( smallGrid, 'dragged' );
		vi.restoreAllMocks();

		const manyChildren = Array.from( { length: 30 }, ( _, i ) => ( {
			clientId: `child-${ i }`,
			left: ( i % 3 ) * 110,
			top: 0,
			width: 100,
			height: 100,
		} ) );
		const { grid: bigGrid, gridReads: bigReads } =
			setUpGrid( manyChildren );
		getGridItemMeasurements( bigGrid, 'child-0' );

		expect( bigReads.count ).toBe( smallReads.count );
	} );

	it( 'returns no src for an inserter drag', () => {
		const { grid } = setUpGrid( children );

		const { siblings, src } = getGridItemMeasurements( grid, null );

		expect( src ).toBeNull();
		expect( siblings ).toHaveLength( 3 );
	} );

	it( 'stores the rotated outline of rotated siblings and the source angle', () => {
		const { grid } = setUpGrid( [
			{ ...children[ 0 ], rotate: '45deg' },
			children[ 1 ],
			{ ...children[ 2 ], rotate: '30deg' },
		] );

		const { siblings, src } = getGridItemMeasurements( grid, 'dragged' );

		expect( siblings[ 0 ].pixelRect ).toEqual(
			getRotatedBoundingRect(
				{ left: 0, top: 0, right: 100, bottom: 100 },
				45
			)
		);
		expect( siblings[ 1 ].pixelRect ).toEqual( {
			left: 110,
			top: 110,
			right: 210,
			bottom: 210,
		} );
		expect( src?.angle ).toBe( 30 );
		expect( src?.pixelRect ).toEqual( {
			left: 220,
			top: 0,
			right: 320,
			bottom: 210,
		} );
	} );
} );
