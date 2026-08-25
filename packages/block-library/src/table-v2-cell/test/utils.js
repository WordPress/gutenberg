import {
	getCellPlacements,
	getColumnInsertionActions,
	getRowInsertionActions,
} from '../utils';

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

describe( 'getColumnInsertionActions', () => {
	it( 'inserts at the raw index matching the visual column', () => {
		const sections = [
			createSection( 'body', [
				createRow( 'row-1', [ createCell( 'a' ), createCell( 'b' ) ] ),
				createRow( 'row-2', [ createCell( 'c' ), createCell( 'd' ) ] ),
			] ),
		];
		const actions = getColumnInsertionActions(
			getCellPlacements( sections ),
			1
		);

		expect( actions.get( 0 ) ).toEqual( { insertIndex: 1 } );
		expect( actions.get( 1 ) ).toEqual( { insertIndex: 1 } );
	} );

	it( 'expands a cell when the column passes through its interior', () => {
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
		const actions = getColumnInsertionActions(
			getCellPlacements( sections ),
			1
		);

		expect( actions.get( 0 ) ).toEqual( {
			expandClientId: 'a',
			newColSpan: 3,
		} );
		expect( actions.get( 1 ) ).toEqual( { insertIndex: 1 } );
	} );

	it( 'adds no cell to the rows a merged cell spans into', () => {
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
		const actions = getColumnInsertionActions(
			getCellPlacements( sections ),
			1
		);

		expect( actions.get( 0 ) ).toEqual( {
			expandClientId: 'a',
			newColSpan: 3,
		} );
		expect( actions.get( 1 ) ).toBeUndefined();
		expect( actions.get( 2 ) ).toEqual( { insertIndex: 1 } );
	} );

	it( 'inserts rather than expands when a span lands exactly on the column', () => {
		const sections = [
			createSection( 'body', [
				createRow( 'row-1', [
					createCell( 'x' ),
					createCell( 'a', { rowSpan: 2 } ),
				] ),
				createRow( 'row-2', [ createCell( 'b' ) ] ),
			] ),
		];
		const actions = getColumnInsertionActions(
			getCellPlacements( sections ),
			1
		);

		expect( actions.get( 0 ) ).toEqual( { insertIndex: 1 } );
		expect( actions.get( 1 ) ).toEqual( { insertIndex: 1 } );
	} );

	it( 'inserts at the table boundaries', () => {
		const sections = [
			createSection( 'body', [
				createRow( 'row-1', [ createCell( 'a' ), createCell( 'b' ) ] ),
			] ),
		];
		const placements = getCellPlacements( sections );

		expect( getColumnInsertionActions( placements, 0 ).get( 0 ) ).toEqual( {
			insertIndex: 0,
		} );
		expect( getColumnInsertionActions( placements, 2 ).get( 0 ) ).toEqual( {
			insertIndex: 2,
		} );
	} );
} );

describe( 'getRowInsertionActions', () => {
	it( 'returns a full cell count and no extensions without spans', () => {
		const sections = [
			createSection( 'body', [
				createRow( 'row-1', [ createCell( 'a' ), createCell( 'b' ) ] ),
				createRow( 'row-2', [ createCell( 'c' ), createCell( 'd' ) ] ),
			] ),
		];
		const { cellCount, rowSpanExtensions } = getRowInsertionActions(
			getCellPlacements( sections ),
			1
		);

		expect( cellCount ).toBe( 2 );
		expect( rowSpanExtensions.size ).toBe( 0 );
	} );

	it( 'extends a rowSpan passing through the insertion point', () => {
		const sections = [
			createSection( 'body', [
				createRow( 'row-1', [
					createCell( 'a', { rowSpan: 2 } ),
					createCell( 'b' ),
				] ),
				createRow( 'row-2', [ createCell( 'c' ) ] ),
			] ),
		];
		const { cellCount, rowSpanExtensions } = getRowInsertionActions(
			getCellPlacements( sections ),
			1
		);

		expect( cellCount ).toBe( 1 );
		expect( [ ...rowSpanExtensions ] ).toEqual( [ [ 'a', 3 ] ] );
	} );

	it( 'subtracts every covered column for a merged cell with rowSpan and colSpan', () => {
		const sections = [
			createSection( 'body', [
				createRow( 'row-1', [
					createCell( 'a', { rowSpan: 2, colSpan: 2 } ),
					createCell( 'b' ),
				] ),
				createRow( 'row-2', [ createCell( 'c' ) ] ),
			] ),
		];
		const { cellCount, rowSpanExtensions } = getRowInsertionActions(
			getCellPlacements( sections ),
			1
		);

		expect( cellCount ).toBe( 1 );
		expect( [ ...rowSpanExtensions ] ).toEqual( [ [ 'a', 3 ] ] );
	} );

	it( 'does not extend a span when inserting past its end', () => {
		const sections = [
			createSection( 'body', [
				createRow( 'row-1', [
					createCell( 'a', { rowSpan: 2 } ),
					createCell( 'b' ),
				] ),
				createRow( 'row-2', [ createCell( 'c' ) ] ),
			] ),
		];
		const { cellCount, rowSpanExtensions } = getRowInsertionActions(
			getCellPlacements( sections ),
			2
		);

		expect( cellCount ).toBe( 2 );
		expect( rowSpanExtensions.size ).toBe( 0 );
	} );

	it( 'subtracts the union of columns covered by multiple spans', () => {
		const sections = [
			createSection( 'body', [
				createRow( 'row-1', [
					createCell( 'a', { rowSpan: 2 } ),
					createCell( 'b', { rowSpan: 2 } ),
				] ),
				createRow( 'row-2', [ createCell( 'c' ) ] ),
			] ),
		];
		const { cellCount, rowSpanExtensions } = getRowInsertionActions(
			getCellPlacements( sections ),
			1
		);

		expect( cellCount ).toBe( 1 );
		expect( [ ...rowSpanExtensions ] ).toEqual( [
			[ 'a', 3 ],
			[ 'b', 3 ],
		] );
	} );
} );
