/**
 * Internal dependencies
 */
import { getGridItemAreaRect, getGridItemRect } from '../utils';

function createGrid() {
	const grid = document.createElement( 'div' );
	const first = document.createElement( 'div' );
	const second = document.createElement( 'div' );
	const third = document.createElement( 'div' );

	grid.append( first, second, third );
	document.body.appendChild( grid );

	return { grid, first, second, third };
}

function mockComputedStyles( styles ) {
	jest.spyOn( window, 'getComputedStyle' ).mockImplementation(
		( element ) => ( {
			getPropertyValue: ( property ) =>
				styles.get( element )?.[ property ] ?? '',
		} )
	);
}

function mockClientRect( element, { left, top, width, height } ) {
	jest.spyOn( element, 'getBoundingClientRect' ).mockReturnValue(
		new window.DOMRect( left, top, width, height )
	);
}

describe( 'grid utils', () => {
	afterEach( () => {
		jest.restoreAllMocks();
		document.body.replaceChildren();
	} );

	it( 'gets the occupied grid rect for auto-placed items that visually render smaller than their grid area', () => {
		const { grid, first, second, third } = createGrid();
		mockComputedStyles(
			new Map( [
				[
					grid,
					{
						'grid-template-columns': '100px 100px 100px',
						'grid-template-rows': '50px 50px',
						'column-gap': '10px',
						'row-gap': '10px',
						'justify-items': 'center',
						'align-items': 'center',
					},
				],
				[
					first,
					{
						'grid-column-start': 'span 2',
						'grid-column-end': 'auto',
						'grid-row-start': 'auto',
						'grid-row-end': 'auto',
					},
				],
				[
					second,
					{
						'grid-column-start': 'auto',
						'grid-column-end': 'auto',
						'grid-row-start': 'auto',
						'grid-row-end': 'auto',
					},
				],
				[
					third,
					{
						'grid-column-start': 'span 2',
						'grid-column-end': 'auto',
						'grid-row-start': 'auto',
						'grid-row-end': 'auto',
					},
				],
			] )
		);
		mockClientRect( grid, {
			left: 0,
			top: 0,
			width: 320,
			height: 110,
		} );
		mockClientRect( first, {
			left: 80,
			top: 15,
			width: 50,
			height: 20,
		} );
		mockClientRect( second, {
			left: 245,
			top: 15,
			width: 50,
			height: 20,
		} );
		mockClientRect( third, {
			left: 80,
			top: 75,
			width: 50,
			height: 20,
		} );

		const firstGridRect = getGridItemRect( first );
		const firstAreaRect = getGridItemAreaRect( first );
		const secondGridRect = getGridItemRect( second );
		const thirdGridRect = getGridItemRect( third );

		expect( firstGridRect ).toMatchObject( {
			columnStart: 1,
			columnEnd: 2,
			rowStart: 1,
			rowEnd: 1,
		} );
		expect( firstAreaRect ).toMatchObject( {
			left: 0,
			top: 0,
			width: 210,
			height: 50,
		} );
		expect( secondGridRect ).toMatchObject( {
			columnStart: 3,
			columnEnd: 3,
			rowStart: 1,
			rowEnd: 1,
		} );
		expect( thirdGridRect ).toMatchObject( {
			columnStart: 1,
			columnEnd: 2,
			rowStart: 2,
			rowEnd: 2,
		} );
	} );

	it( 'gets the occupied grid area for manually positioned items', () => {
		const { grid, first } = createGrid();
		mockComputedStyles(
			new Map( [
				[
					grid,
					{
						'grid-template-columns': '100px 100px 100px',
						'grid-template-rows': '50px 50px 50px',
						'column-gap': '10px',
						'row-gap': '10px',
					},
				],
				[
					first,
					{
						'grid-column-start': '2',
						'grid-column-end': 'span 2',
						'grid-row-start': '2',
						'grid-row-end': 'span 2',
					},
				],
			] )
		);

		expect( getGridItemAreaRect( first ) ).toMatchObject( {
			left: 110,
			top: 60,
			width: 210,
			height: 110,
		} );
	} );
} );
