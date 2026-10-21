import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useReviewRows } from '../use-review-rows';

const fontSizeRow = {
	id: 'typography.fontSize',
	primaryPath: [ 'typography', 'fontSize' ],
	paths: [
		{
			path: [ 'typography', 'fontSize' ],
			value: 'var:preset|font-size|large',
		},
	],
	presetAttributes: [ 'fontSize' ],
	newValue: 'var:preset|font-size|large',
};

const lineHeightRow = {
	id: 'typography.lineHeight',
	primaryPath: [ 'typography', 'lineHeight' ],
	paths: [ { path: [ 'typography', 'lineHeight' ], value: '2' } ],
	presetAttributes: [],
	newValue: '2',
};

function getReviewRows(
	rows: object[],
	styles: Record< string, unknown >,
	elements: string[],
	name = 'core/button'
) {
	const { result } = renderHook( () =>
		useReviewRows( rows, { styles }, name, elements )
	);
	return result.current;
}

describe( 'useReviewRows', () => {
	it( 'shows a value the block type gets from its element layer', () => {
		const [ row ] = getReviewRows(
			[ fontSizeRow ],
			{
				typography: { fontSize: '1rem' },
				elements: {
					button: {
						typography: { fontSize: 'var:preset|font-size|small' },
					},
				},
			},
			[ 'button' ]
		);

		expect( row.currentValue ).toBe( 'var:preset|font-size|small' );
		expect( row.formattedCurrentValue ).toBe( 'Small' );
	} );

	it( 'shows a root value that cascades to a block with no element layer', () => {
		const [ row ] = getReviewRows(
			[ lineHeightRow ],
			{ typography: { lineHeight: '1.4' } },
			[],
			'core/group'
		);

		expect( row.formattedCurrentValue ).toBe( '1.4' );
	} );
} );
