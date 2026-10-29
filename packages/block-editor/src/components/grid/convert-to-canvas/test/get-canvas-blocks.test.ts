import { describe, expect, it } from 'vitest';
import { getItemStyle } from '../get-canvas-blocks';

describe( 'getItemStyle', () => {
	const layout = { columnStart: 2, rowStart: 3, columnSpan: 4, rowSpan: 2 };

	it( 'replaces the layout and clears margins', () => {
		expect(
			getItemStyle(
				{
					color: { text: 'red' },
					spacing: {
						margin: { top: '-2em' },
						padding: { top: '1em' },
					},
					layout: { selfStretch: 'fill' },
				},
				layout
			)
		).toEqual( {
			color: { text: 'red' },
			spacing: { padding: { top: '1em' } },
			layout,
		} );
	} );

	it( 'drops viewport layouts and sets the tablet rows', () => {
		expect(
			getItemStyle(
				{
					spacing: { margin: { top: '1em' } },
					'@mobile': { layout: { selfStretch: 'fit' } },
					'@tablet': {
						layout: { flexSize: '10px' },
						color: { text: 'blue' },
					},
				},
				layout,
				{ rowStart: 4, rowSpan: 3 }
			)
		).toEqual( {
			'@tablet': {
				color: { text: 'blue' },
				layout: { rowStart: 4, rowSpan: 3 },
			},
			layout,
		} );
	} );
} );
