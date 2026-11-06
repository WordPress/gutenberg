import { describe, expect, it } from 'vitest';
import { getAutoGridItemStyleAfterDrop } from '../auto-grid-drop';

describe( 'getAutoGridItemStyleAfterDrop', () => {
	it( 'drops an explicitly placed auto-grid child back into auto placement', () => {
		expect(
			getAutoGridItemStyleAfterDrop(
				{ type: 'grid' },
				{
					color: { text: '#000' },
					layout: {
						columnStart: 2,
						rowStart: 3,
						columnSpan: 2,
					},
				},
				undefined
			)
		).toEqual( {
			shouldReset: true,
			style: {
				color: { text: '#000' },
				layout: {
					columnStart: undefined,
					rowStart: undefined,
					columnSpan: 2,
				},
			},
		} );
	} );

	it( 'keeps explicit placement for a child of a manual grid', () => {
		expect(
			getAutoGridItemStyleAfterDrop(
				{ type: 'grid', isManualPlacement: true },
				{
					layout: {
						columnStart: 2,
						rowStart: 3,
					},
				},
				undefined
			)
		).toEqual( { shouldReset: false } );
	} );
} );
