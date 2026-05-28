/**
 * Internal dependencies
 */
import {
	getCellRectangleClientIds,
	getCellSelectionOutsideBorderAttributes,
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
} );
