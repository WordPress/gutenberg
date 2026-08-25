import {
	getCellPlacements,
	getColumnDeletionActions,
	getColumnInsertionActions,
	getRowDeletionActions,
	getRowInsertionActions,
	getSplitActions,
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

describe( 'getSplitActions', () => {
	it( 'returns null for an unmerged cell', () => {
		const sections = [
			createSection( 'body', [
				createRow( 'row-1', [ createCell( 'a' ), createCell( 'b' ) ] ),
			] ),
		];

		expect(
			getSplitActions( getCellPlacements( sections ), 'a' )
		).toBeNull();
	} );

	it( 'refills the remaining columns of a colSpan in its own row', () => {
		const sections = [
			createSection( 'body', [
				createRow( 'row-1', [
					createCell( 'a' ),
					createCell( 'b', { colSpan: 2 } ),
					createCell( 'c' ),
				] ),
			] ),
		];
		const split = getSplitActions( getCellPlacements( sections ), 'b' );

		expect( split.resetClientId ).toBe( 'b' );
		expect( [ ...split.insertionsByRow ] ).toEqual( [
			[ 0, { insertIndex: 2, count: 1 } ],
		] );
	} );

	it( 'refills the rows covered by a rowSpan', () => {
		const sections = [
			createSection( 'body', [
				createRow( 'row-1', [
					createCell( 'a' ),
					createCell( 'b', { rowSpan: 2 } ),
				] ),
				createRow( 'row-2', [ createCell( 'c' ), createCell( 'd' ) ] ),
			] ),
		];
		const split = getSplitActions( getCellPlacements( sections ), 'b' );

		expect( [ ...split.insertionsByRow ] ).toEqual( [
			[ 0, { insertIndex: 2, count: 0 } ],
			[ 1, { insertIndex: 1, count: 1 } ],
		] );
	} );

	it( 'refills rows and columns for a cell with rowSpan and colSpan', () => {
		const sections = [
			createSection( 'body', [
				createRow( 'row-1', [
					createCell( 'a', { rowSpan: 2, colSpan: 2 } ),
					createCell( 'b' ),
				] ),
				createRow( 'row-2', [ createCell( 'c' ) ] ),
			] ),
		];
		const split = getSplitActions( getCellPlacements( sections ), 'a' );

		expect( [ ...split.insertionsByRow ] ).toEqual( [
			[ 0, { insertIndex: 1, count: 1 } ],
			[ 1, { insertIndex: 0, count: 2 } ],
		] );
	} );

	it( 'derives the insertion index from the visual column when a span from above shifts the row', () => {
		const sections = [
			createSection( 'body', [
				createRow( 'row-1', [
					createCell( 'a', { rowSpan: 2 } ),
					createCell( 'b' ),
					createCell( 'c' ),
				] ),
				createRow( 'row-2', [
					createCell( 'd', { rowSpan: 2, colSpan: 2 } ),
				] ),
				createRow( 'row-3', [ createCell( 'e' ) ] ),
			] ),
		];
		// d is visually at column 1 (a covers column 0 of row 1), so the
		// cells refilling row 3 go after e, not before it.
		const split = getSplitActions( getCellPlacements( sections ), 'd' );

		expect( [ ...split.insertionsByRow ] ).toEqual( [
			[ 1, { insertIndex: 1, count: 1 } ],
			[ 2, { insertIndex: 1, count: 2 } ],
		] );
	} );
} );

describe( 'getColumnDeletionActions', () => {
	it( 'deletes the cells in the column from every row', () => {
		const sections = [
			createSection( 'body', [
				createRow( 'row-1', [
					createCell( 'a' ),
					createCell( 'b' ),
					createCell( 'c' ),
				] ),
				createRow( 'row-2', [
					createCell( 'd' ),
					createCell( 'e' ),
					createCell( 'f' ),
				] ),
			] ),
		];
		const actions = getColumnDeletionActions(
			getCellPlacements( sections ),
			1,
			1
		);

		expect( actions.get( 0 ).deletedClientIds ).toEqual(
			new Set( [ 'b' ] )
		);
		expect( actions.get( 1 ).deletedClientIds ).toEqual(
			new Set( [ 'e' ] )
		);
	} );

	it( 'deletes a range of columns', () => {
		const sections = [
			createSection( 'body', [
				createRow( 'row-1', [
					createCell( 'a' ),
					createCell( 'b' ),
					createCell( 'c' ),
				] ),
			] ),
		];
		const actions = getColumnDeletionActions(
			getCellPlacements( sections ),
			1,
			2
		);

		expect( actions.get( 0 ).deletedClientIds ).toEqual(
			new Set( [ 'b', 'c' ] )
		);
	} );

	it( 'reduces the colSpan of a cell spanning into the range', () => {
		const sections = [
			createSection( 'body', [
				createRow( 'row-1', [
					createCell( 'a', { colSpan: 3 } ),
					createCell( 'b' ),
				] ),
			] ),
		];
		const actions = getColumnDeletionActions(
			getCellPlacements( sections ),
			1,
			1
		);

		expect( actions.get( 0 ).deletedClientIds.size ).toBe( 0 );
		expect( [ ...actions.get( 0 ).spanReductions ] ).toEqual( [
			[ 'a', 2 ],
		] );
	} );

	it( 'deletes a cell starting in the range even when its span extends past it', () => {
		const sections = [
			createSection( 'body', [
				createRow( 'row-1', [
					createCell( 'a' ),
					createCell( 'b', { colSpan: 3 } ),
				] ),
			] ),
		];
		// The dispatch layer splits b first; the helper only records the
		// deletion of whatever starts in the range.
		const actions = getColumnDeletionActions(
			getCellPlacements( sections ),
			1,
			2
		);

		expect( actions.get( 0 ).deletedClientIds ).toEqual(
			new Set( [ 'b' ] )
		);
		expect( actions.get( 0 ).spanReductions.size ).toBe( 0 );
	} );
} );

describe( 'getRowDeletionActions', () => {
	it( 'deletes the given row', () => {
		const sections = [
			createSection( 'body', [
				createRow( 'row-1', [ createCell( 'a' ) ] ),
				createRow( 'row-2', [ createCell( 'b' ) ] ),
				createRow( 'row-3', [ createCell( 'c' ) ] ),
			] ),
		];
		const { deletedRowIndexes, spanReductions } = getRowDeletionActions(
			getCellPlacements( sections ),
			1,
			1
		);

		expect( deletedRowIndexes ).toEqual( new Set( [ 1 ] ) );
		expect( spanReductions.size ).toBe( 0 );
	} );

	it( 'deletes a range of rows', () => {
		const sections = [
			createSection( 'body', [
				createRow( 'row-1', [ createCell( 'a' ) ] ),
				createRow( 'row-2', [ createCell( 'b' ) ] ),
				createRow( 'row-3', [ createCell( 'c' ) ] ),
			] ),
		];
		const { deletedRowIndexes } = getRowDeletionActions(
			getCellPlacements( sections ),
			1,
			2
		);

		expect( deletedRowIndexes ).toEqual( new Set( [ 1, 2 ] ) );
	} );

	it( 'reduces the rowSpan of a cell spanning into the range', () => {
		const sections = [
			createSection( 'body', [
				createRow( 'row-1', [
					createCell( 'a', { rowSpan: 3 } ),
					createCell( 'b' ),
				] ),
				createRow( 'row-2', [ createCell( 'c' ) ] ),
				createRow( 'row-3', [ createCell( 'd' ) ] ),
				createRow( 'row-4', [ createCell( 'e' ), createCell( 'f' ) ] ),
			] ),
		];
		const { deletedRowIndexes, spanReductions } = getRowDeletionActions(
			getCellPlacements( sections ),
			1,
			2
		);

		expect( deletedRowIndexes ).toEqual( new Set( [ 1, 2 ] ) );
		expect( [ ...spanReductions ] ).toEqual( [ [ 'a', 1 ] ] );
	} );
} );
