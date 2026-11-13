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

	it( 'returns an inherited pinned child to auto placement only in the selected viewport', () => {
		const baseLayout = { columnStart: 2, rowStart: 3, columnSpan: 2 };
		const result = getAutoGridItemStyleAfterDrop(
			{ type: 'grid' },
			{ layout: baseLayout, '@mobile': { color: { text: '#000' } } },
			{ viewport: '@mobile', pseudo: 'default' }
		);
		expect( result ).toEqual( {
			shouldReset: true,
			style: {
				layout: baseLayout,
				'@mobile': {
					color: { text: '#000' },
					layout: { columnStart: null, rowStart: null },
				},
			},
		} );
		expect( JSON.parse( JSON.stringify( result.style ) ) ).toEqual(
			result.style
		);
	} );

	it( 'does not reset a child already auto-placed in the selected viewport', () => {
		expect(
			getAutoGridItemStyleAfterDrop(
				{ type: 'grid' },
				{
					layout: { columnStart: 2, rowStart: 3 },
					'@mobile': {
						layout: { columnStart: null, rowStart: null },
					},
				},
				{ viewport: '@mobile', pseudo: 'default' }
			)
		).toEqual( { shouldReset: false } );
	} );
} );
