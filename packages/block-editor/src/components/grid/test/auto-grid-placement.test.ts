import { describe, expect, it } from 'vitest';
import { findAutoGridReorderIndex } from '../auto-grid-placement';
import { GridRect } from '../utils';
import type { AutoGridItem } from '../auto-grid-placement';

function autoItem(
	clientId: string,
	columnStart: number,
	columnSpan: number,
	rowStart: number,
	rowSpan = 1
): AutoGridItem {
	return {
		clientId,
		rect: new GridRect( {
			columnStart,
			columnSpan,
			rowStart,
			rowSpan,
		} ),
	};
}

describe( 'findAutoGridReorderIndex', () => {
	it( 'moves a multi-span item right by reordering past auto-placed items', () => {
		const items = [
			autoItem( 'a', 1, 2, 1 ),
			autoItem( 'b', 3, 1, 1 ),
			autoItem( 'c', 1, 2, 2 ),
			autoItem( 'd', 3, 1, 2 ),
			autoItem( 'e', 4, 1, 2 ),
		];

		expect(
			findAutoGridReorderIndex(
				{ columnCount: 4, items },
				[ 'a', 'b', 'c', 'd', 'e' ],
				'c',
				new GridRect( {
					columnStart: 2,
					columnSpan: 2,
					rowStart: 2,
				} ),
				'right'
			)
		).toBe( 4 );
	} );

	it( 'moves a multi-span item down without adding explicit placement', () => {
		const items = [
			autoItem( 'a', 1, 2, 1 ),
			autoItem( 'b', 3, 1, 1 ),
			autoItem( 'c', 4, 1, 1 ),
			autoItem( 'd', 1, 1, 2 ),
			autoItem( 'e', 2, 1, 2 ),
		];

		expect(
			findAutoGridReorderIndex(
				{ columnCount: 4, items },
				[ 'a', 'b', 'c', 'd', 'e' ],
				'a',
				new GridRect( {
					columnStart: 1,
					columnSpan: 2,
					rowStart: 2,
				} ),
				'down'
			)
		).toBe( 3 );
	} );
} );
