import { getCellPlacements } from '../utils';

function createCell( clientId, attributes = {} ) {
	return {
		clientId,
		attributes: { rowSpan: 1, colSpan: 1, ...attributes },
		innerBlocks: [],
	};
}

function createRow( clientId, cells ) {
	return { clientId, attributes: {}, innerBlocks: cells };
}

function createSection( type, rows ) {
	return {
		clientId: `section-${ type }`,
		attributes: { type },
		innerBlocks: rows,
	};
}

describe( 'getCellPlacements', () => {
	it( 'returns visual placements for a grid without spans', () => {
		const sections = [
			createSection( 'body', [
				createRow( 'row-1', [ createCell( 'a' ), createCell( 'b' ) ] ),
				createRow( 'row-2', [ createCell( 'c' ), createCell( 'd' ) ] ),
			] ),
		];

		expect( getCellPlacements( sections ) ).toEqual( [
			{
				clientId: 'a',
				rowIndex: 0,
				columnIndex: 0,
				rowSpan: 1,
				colSpan: 1,
				sectionType: 'body',
			},
			{
				clientId: 'b',
				rowIndex: 0,
				columnIndex: 1,
				rowSpan: 1,
				colSpan: 1,
				sectionType: 'body',
			},
			{
				clientId: 'c',
				rowIndex: 1,
				columnIndex: 0,
				rowSpan: 1,
				colSpan: 1,
				sectionType: 'body',
			},
			{
				clientId: 'd',
				rowIndex: 1,
				columnIndex: 1,
				rowSpan: 1,
				colSpan: 1,
				sectionType: 'body',
			},
		] );
	} );

	it( 'advances the column index past a colSpan', () => {
		const sections = [
			createSection( 'body', [
				createRow( 'row-1', [
					createCell( 'a', { colSpan: 2 } ),
					createCell( 'b' ),
				] ),
				createRow( 'row-2', [
					createCell( 'c' ),
					createCell( 'd' ),
					createCell( 'e' ),
				] ),
			] ),
		];

		expect(
			getCellPlacements( sections ).map(
				( { clientId, rowIndex, columnIndex } ) => ( {
					clientId,
					rowIndex,
					columnIndex,
				} )
			)
		).toEqual( [
			{ clientId: 'a', rowIndex: 0, columnIndex: 0 },
			{ clientId: 'b', rowIndex: 0, columnIndex: 2 },
			{ clientId: 'c', rowIndex: 1, columnIndex: 0 },
			{ clientId: 'd', rowIndex: 1, columnIndex: 1 },
			{ clientId: 'e', rowIndex: 1, columnIndex: 2 },
		] );
	} );

	it( 'advances the column index past a rowSpan from a row above', () => {
		const sections = [
			createSection( 'body', [
				createRow( 'row-1', [
					createCell( 'a', { rowSpan: 2 } ),
					createCell( 'b' ),
				] ),
				createRow( 'row-2', [ createCell( 'c' ) ] ),
			] ),
		];

		expect(
			getCellPlacements( sections ).map(
				( { clientId, rowIndex, columnIndex } ) => ( {
					clientId,
					rowIndex,
					columnIndex,
				} )
			)
		).toEqual( [
			{ clientId: 'a', rowIndex: 0, columnIndex: 0 },
			{ clientId: 'b', rowIndex: 0, columnIndex: 1 },
			{ clientId: 'c', rowIndex: 1, columnIndex: 1 },
		] );
	} );

	it( 'accounts for combined rowSpan and colSpan', () => {
		const sections = [
			createSection( 'body', [
				createRow( 'row-1', [
					createCell( 'a', { rowSpan: 2, colSpan: 2 } ),
					createCell( 'b' ),
				] ),
				createRow( 'row-2', [ createCell( 'c' ) ] ),
				createRow( 'row-3', [
					createCell( 'd' ),
					createCell( 'e' ),
					createCell( 'f' ),
				] ),
			] ),
		];

		expect(
			getCellPlacements( sections ).map(
				( { clientId, rowIndex, columnIndex } ) => ( {
					clientId,
					rowIndex,
					columnIndex,
				} )
			)
		).toEqual( [
			{ clientId: 'a', rowIndex: 0, columnIndex: 0 },
			{ clientId: 'b', rowIndex: 0, columnIndex: 2 },
			{ clientId: 'c', rowIndex: 1, columnIndex: 2 },
			{ clientId: 'd', rowIndex: 2, columnIndex: 0 },
			{ clientId: 'e', rowIndex: 2, columnIndex: 1 },
			{ clientId: 'f', rowIndex: 2, columnIndex: 2 },
		] );
	} );

	it( 'continues row indexes across sections', () => {
		const sections = [
			createSection( 'head', [
				createRow( 'row-1', [ createCell( 'a' ), createCell( 'b' ) ] ),
			] ),
			createSection( 'body', [
				createRow( 'row-2', [ createCell( 'c' ), createCell( 'd' ) ] ),
			] ),
		];

		expect( getCellPlacements( sections ) ).toEqual( [
			{
				clientId: 'a',
				rowIndex: 0,
				columnIndex: 0,
				rowSpan: 1,
				colSpan: 1,
				sectionType: 'head',
			},
			{
				clientId: 'b',
				rowIndex: 0,
				columnIndex: 1,
				rowSpan: 1,
				colSpan: 1,
				sectionType: 'head',
			},
			{
				clientId: 'c',
				rowIndex: 1,
				columnIndex: 0,
				rowSpan: 1,
				colSpan: 1,
				sectionType: 'body',
			},
			{
				clientId: 'd',
				rowIndex: 1,
				columnIndex: 1,
				rowSpan: 1,
				colSpan: 1,
				sectionType: 'body',
			},
		] );
	} );
} );
