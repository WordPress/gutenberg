import {
	getCellRectangleClientIds,
	getCellSelectionOutsideBorderAttributes,
	getCellSelectionOutsideBorderValue,
	mergeCells,
	unmergeCells,
} from '../utils';

function createCell( clientId, attributes = {} ) {
	return {
		clientId,
		attributes,
	};
}

describe( 'table-v2 utils', () => {
	describe( 'getCellRectangleClientIds', () => {
		it( 'returns cells in the rectangle between two cell IDs', () => {
			const rows = [
				{ type: 'body', cellCount: 3 },
				{ type: 'body', cellCount: 3 },
				{ type: 'body', cellCount: 3 },
			];
			const cells = [
				createCell( 'cell-1' ),
				createCell( 'cell-2' ),
				createCell( 'cell-3' ),
				createCell( 'cell-4' ),
				createCell( 'cell-5' ),
				createCell( 'cell-6' ),
				createCell( 'cell-7' ),
				createCell( 'cell-8' ),
				createCell( 'cell-9' ),
			];

			expect(
				getCellRectangleClientIds( rows, cells, 3, 'cell-2', 'cell-9' )
			).toEqual( [
				'cell-2',
				'cell-3',
				'cell-5',
				'cell-6',
				'cell-8',
				'cell-9',
			] );
		} );

		it( 'returns null when either cell ID is missing', () => {
			const rows = [ { type: 'body', cellCount: 2 } ];
			const cells = [ createCell( 'cell-1' ), createCell( 'cell-2' ) ];

			expect(
				getCellRectangleClientIds(
					rows,
					cells,
					2,
					'cell-1',
					'missing-cell'
				)
			).toBeNull();
		} );

		it( 'includes cells with spans that intersect the rectangle', () => {
			const rows = [
				{ type: 'body', cellCount: 2 },
				{ type: 'body', cellCount: 3 },
			];
			const cells = [
				createCell( 'cell-1', { colSpan: 2 } ),
				createCell( 'cell-2' ),
				createCell( 'cell-3' ),
				createCell( 'cell-4' ),
				createCell( 'cell-5' ),
			];

			expect(
				getCellRectangleClientIds( rows, cells, 3, 'cell-2', 'cell-4' )
			).toEqual( [ 'cell-1', 'cell-2', 'cell-4', 'cell-5' ] );
		} );

		it( 'expands rectangle to cover rowSpan of start/end cells', () => {
			// 4x4 table with rowSpan=2 on col 0 and col 3 in rows 0-1.
			// Row 0: cell-A (col 0, rowSpan 2), cell-B (col 1), cell-C (col 2), cell-D (col 3, rowSpan 2)
			// Row 1: (occupied by A), cell-E (col 1), cell-F (col 2), (occupied by D)
			// Row 2: cell-G, cell-H, cell-I, cell-J
			// Row 3: cell-K, cell-L, cell-M, cell-N
			const rows = [
				{ type: 'body', cellCount: 2 },
				{ type: 'body', cellCount: 2 },
				{ type: 'body', cellCount: 4 },
				{ type: 'body', cellCount: 4 },
			];
			const cells = [
				createCell( 'cell-A', { rowSpan: 2 } ),
				createCell( 'cell-B' ),
				createCell( 'cell-C' ),
				createCell( 'cell-D', { rowSpan: 2 } ),
				createCell( 'cell-E' ),
				createCell( 'cell-F' ),
				createCell( 'cell-G' ),
				createCell( 'cell-H' ),
				createCell( 'cell-I' ),
				createCell( 'cell-J' ),
				createCell( 'cell-K' ),
				createCell( 'cell-L' ),
				createCell( 'cell-M' ),
				createCell( 'cell-N' ),
			];

			// Drag from cell-A (row 0, col 0, rowSpan 2) to cell-D (row 0, col 3, rowSpan 2).
			// Rectangle should expand to rows 0-1, cols 0-3, selecting all 6 cells.
			expect(
				getCellRectangleClientIds( rows, cells, 4, 'cell-A', 'cell-D' )
			).toEqual( [
				'cell-A',
				'cell-B',
				'cell-C',
				'cell-D',
				'cell-E',
				'cell-F',
			] );
		} );
	} );

	describe( 'getCellSelectionOutsideBorderAttributes', () => {
		it( 'returns unique updates for the outside of the selected rectangle', () => {
			const rows = [
				{ type: 'body', cellCount: 3 },
				{ type: 'body', cellCount: 3 },
				{ type: 'body', cellCount: 3 },
			];
			const cells = [
				createCell( 'cell-1' ),
				createCell( 'cell-2' ),
				createCell( 'cell-3' ),
				createCell( 'cell-4' ),
				createCell( 'cell-5' ),
				createCell( 'cell-6' ),
				createCell( 'cell-7' ),
				createCell( 'cell-8' ),
				createCell( 'cell-9' ),
			];
			const border = {
				color: '#000000',
				style: 'solid',
				width: '2px',
			};

			expect(
				getCellSelectionOutsideBorderAttributes(
					rows,
					cells,
					3,
					[ 'cell-2', 'cell-3', 'cell-5', 'cell-6' ],
					border
				)
			).toEqual( {
				'cell-2': { style: { border: { top: border, left: border } } },
				'cell-3': { style: { border: { top: border, right: border } } },
				'cell-5': {
					style: { border: { bottom: border, left: border } },
				},
				'cell-6': {
					style: { border: { right: border, bottom: border } },
				},
			} );
		} );

		it( 'preserves existing cell border styles', () => {
			const rows = [ { type: 'body', cellCount: 2 } ];
			const cells = [
				createCell( 'cell-1', {
					style: {
						border: {
							right: { width: '1px' },
						},
					},
				} ),
				createCell( 'cell-2' ),
			];
			const border = { width: '2px' };

			expect(
				getCellSelectionOutsideBorderAttributes(
					rows,
					cells,
					2,
					[ 'cell-1', 'cell-2' ],
					border
				)[ 'cell-1' ].style.border
			).toEqual( {
				top: border,
				right: { width: '1px' },
				bottom: border,
				left: border,
			} );
		} );
	} );

	describe( 'getCellSelectionOutsideBorderValue', () => {
		it( 'returns the shared outside border value', () => {
			const border = {
				color: '#cc1818',
				style: 'solid',
				width: '4px',
			};
			const rows = [
				{ type: 'body', cellCount: 2 },
				{ type: 'body', cellCount: 2 },
			];
			const cells = [
				createCell( 'cell-1', {
					style: { border: { top: border, left: border } },
				} ),
				createCell( 'cell-2', {
					style: { border: { top: border, right: border } },
				} ),
				createCell( 'cell-3', {
					style: { border: { bottom: border, left: border } },
				} ),
				createCell( 'cell-4', {
					style: { border: { right: border, bottom: border } },
				} ),
			];

			expect(
				getCellSelectionOutsideBorderValue( rows, cells, 2, [
					'cell-1',
					'cell-2',
					'cell-3',
					'cell-4',
				] )
			).toEqual( border );
		} );

		it( 'returns undefined for mixed outside border values', () => {
			const rows = [ { type: 'body', cellCount: 2 } ];
			const cells = [
				createCell( 'cell-1', {
					style: { border: { top: { width: '4px' } } },
				} ),
				createCell( 'cell-2', {
					style: { border: { top: { width: '2px' } } },
				} ),
			];

			expect(
				getCellSelectionOutsideBorderValue( rows, cells, 2, [
					'cell-1',
					'cell-2',
				] )
			).toBeUndefined();
		} );
	} );

	describe( 'mergeCells', () => {
		it( 'merges a 2x2 rectangle into a single cell with rowSpan and colSpan', () => {
			const rows = [
				{ type: 'body', cellCount: 2 },
				{ type: 'body', cellCount: 2 },
			];
			const cells = [
				createCell( 'cell-1' ),
				createCell( 'cell-2' ),
				createCell( 'cell-3' ),
				createCell( 'cell-4' ),
			];

			const result = mergeCells( rows, cells, 2, [
				'cell-1',
				'cell-2',
				'cell-3',
				'cell-4',
			] );

			expect( result ).not.toBeNull();
			expect( result.cells ).toHaveLength( 1 );
			expect( result.cells[ 0 ].clientId ).toBe( 'cell-1' );
			expect( result.cells[ 0 ].attributes.rowSpan ).toBe( 2 );
			expect( result.cells[ 0 ].attributes.colSpan ).toBe( 2 );
			expect( result.mergedClientId ).toBe( 'cell-1' );
			// Row 0 had 2 cells, 1 removed (cell-2), so 1 remains.
			expect( result.rows[ 0 ].cellCount ).toBe( 1 );
			// Row 1 had 2 cells, 2 removed (cell-3, cell-4), so 0 remain.
			expect( result.rows[ 1 ].cellCount ).toBe( 0 );
		} );

		it( 'merges two cells in the same row (colSpan only)', () => {
			const rows = [ { type: 'body', cellCount: 3 } ];
			const cells = [
				createCell( 'cell-1' ),
				createCell( 'cell-2' ),
				createCell( 'cell-3' ),
			];

			const result = mergeCells( rows, cells, 3, [ 'cell-1', 'cell-2' ] );

			expect( result ).not.toBeNull();
			expect( result.cells ).toHaveLength( 2 );
			expect( result.cells[ 0 ].clientId ).toBe( 'cell-1' );
			expect( result.cells[ 0 ].attributes.colSpan ).toBe( 2 );
			expect( result.cells[ 0 ].attributes.rowSpan ).toBe( 1 );
			expect( result.rows[ 0 ].cellCount ).toBe( 2 );
		} );

		it( 'returns null for cross-section selection', () => {
			const rows = [
				{ type: 'head', cellCount: 2 },
				{ type: 'body', cellCount: 2 },
			];
			const cells = [
				createCell( 'cell-1', { tag: 'th' } ),
				createCell( 'cell-2', { tag: 'th' } ),
				createCell( 'cell-3', { tag: 'td' } ),
				createCell( 'cell-4', { tag: 'td' } ),
			];

			const result = mergeCells( rows, cells, 2, [ 'cell-2', 'cell-3' ] );

			expect( result ).toBeNull();
		} );

		it( 'returns null for a single cell selection', () => {
			const rows = [ { type: 'body', cellCount: 2 } ];
			const cells = [ createCell( 'cell-1' ), createCell( 'cell-2' ) ];

			const result = mergeCells( rows, cells, 2, [ 'cell-1' ] );

			expect( result ).toBeNull();
		} );

		it( 'returns null when a selected cell is already merged', () => {
			const rows = [ { type: 'body', cellCount: 2 } ];
			const cells = [
				createCell( 'cell-1', { colSpan: 2 } ),
				createCell( 'cell-2' ),
			];

			const result = mergeCells( rows, cells, 2, [ 'cell-1', 'cell-2' ] );

			expect( result ).toBeNull();
		} );
	} );

	describe( 'unmergeCells', () => {
		it( 'unmerges a 2x2 cell back to 4 cells', () => {
			const rows = [
				{ type: 'body', cellCount: 1 },
				{ type: 'body', cellCount: 0 },
			];
			const cells = [
				createCell( 'cell-1', { rowSpan: 2, colSpan: 2 } ),
			];

			const result = unmergeCells( rows, cells, 2, 'cell-1' );

			expect( result ).not.toBeNull();
			expect( result.cells ).toHaveLength( 4 );
			expect( result.cells[ 0 ].clientId ).toBe( 'cell-1' );
			expect( result.cells[ 0 ].attributes.rowSpan ).toBe( 1 );
			expect( result.cells[ 0 ].attributes.colSpan ).toBe( 1 );
			expect( result.rows[ 0 ].cellCount ).toBe( 2 );
			expect( result.rows[ 1 ].cellCount ).toBe( 2 );
		} );

		it( 'unmerges a colSpan-only cell', () => {
			const rows = [ { type: 'body', cellCount: 1 } ];
			const cells = [ createCell( 'cell-1', { colSpan: 3 } ) ];

			const result = unmergeCells( rows, cells, 3, 'cell-1' );

			expect( result ).not.toBeNull();
			expect( result.cells ).toHaveLength( 3 );
			expect( result.cells[ 0 ].clientId ).toBe( 'cell-1' );
			expect( result.cells[ 0 ].attributes.colSpan ).toBe( 1 );
			expect( result.rows[ 0 ].cellCount ).toBe( 3 );
		} );

		it( 'returns null for a non-merged cell', () => {
			const rows = [ { type: 'body', cellCount: 2 } ];
			const cells = [ createCell( 'cell-1' ), createCell( 'cell-2' ) ];

			const result = unmergeCells( rows, cells, 2, 'cell-1' );

			expect( result ).toBeNull();
		} );
	} );
} );
