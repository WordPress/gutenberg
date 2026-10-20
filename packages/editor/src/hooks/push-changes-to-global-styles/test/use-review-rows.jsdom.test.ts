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

const paddingRow = {
	id: 'spacing.padding',
	primaryPath: [ 'spacing', 'padding' ],
	paths: [ { path: [ 'spacing', 'padding' ], value: '2em' } ],
	presetAttributes: [],
	newValue: '2em',
	format: 'spacing',
};

const lineHeightRow = {
	id: 'typography.lineHeight',
	primaryPath: [ 'typography', 'lineHeight' ],
	paths: [ { path: [ 'typography', 'lineHeight' ], value: '2' } ],
	presetAttributes: [],
	newValue: '2',
};

const linkColorRow = {
	id: 'color.link',
	primaryPath: [ 'elements', 'link', 'color', 'text' ],
	paths: [
		{
			path: [ 'elements', 'link', 'color', 'text' ],
			value: '#ff0000',
		},
	],
	presetAttributes: [],
	newValue: '#ff0000',
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
		expect( row.formattedNewValue ).toBe( 'Large' );
	} );

	it( 'prefers the block layer over the element layer', () => {
		const [ row ] = getReviewRows(
			[ fontSizeRow ],
			{
				elements: {
					button: { typography: { fontSize: '1rem' } },
				},
				blocks: {
					'core/button': { typography: { fontSize: '1.5rem' } },
				},
			},
			[ 'button' ]
		);

		expect( row.formattedCurrentValue ).toBe( '1.5rem' );
	} );

	it( 'leaves out root values that do not reach the block', () => {
		const [ row ] = getReviewRows(
			[ paddingRow ],
			{ spacing: { padding: '3em' } },
			[ 'button' ]
		);

		expect( row.currentValue ).toBeUndefined();
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

	it( 'shows the root link color on a Paragraph link color row', () => {
		const [ row ] = getReviewRows(
			[ linkColorRow ],
			{ elements: { link: { color: { text: 'currentColor' } } } },
			[],
			'core/paragraph'
		);

		expect( row.formattedCurrentValue ).toBe( 'currentColor' );
	} );
} );
