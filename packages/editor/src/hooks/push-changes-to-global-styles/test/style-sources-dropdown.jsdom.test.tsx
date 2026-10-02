import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StyleSourcesDropdown from '../style-sources-dropdown';

vi.mock( import( '@wordpress/blocks' ), async ( importOriginal ) => {
	const original = await importOriginal();
	return {
		...original,
		getBlockType: ( () => ( {
			title: 'Button',
		} ) ) as unknown as typeof original.getBlockType,
	};
} );

const changedRows = [
	{
		id: 'typography.fontSize',
		label: 'Font size',
		value: '20px',
		isOverride: true,
		replacedValue: 'Medium',
		sourceLabel: 'Button element',
		leafPaths: [ [ 'typography', 'fontSize' ] ],
		presetAttributes: [],
	},
	{
		id: 'typography.letterSpacing',
		label: 'Letter spacing',
		value: '1px',
		isOverride: false,
		sourceLabel: 'Not set in Global Styles',
		leafPaths: [ [ 'typography', 'letterSpacing' ] ],
		presetAttributes: [],
	},
];

vi.mock( import( '../use-style-source-rows' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useStyleSourceRows: () => ( {
		changed: changedRows,
		inherited: [
			{
				id: 'typography.fontFamily',
				label: 'Font family',
				value: 'Serif',
				sourceLabel: 'Typography style',
			},
			{
				id: 'typography.fontWeight',
				label: 'Font weight',
				value: 'inherit',
				sourceLabel: 'Button element',
			},
		],
		variationLabel: 'Outline',
	} ),
} ) );

const attributes = {
	className: 'is-style-outline',
	style: {
		css: 'color: red;',
		typography: { fontSize: '20px', letterSpacing: '1px' },
	},
};

async function openPopover( setAttributes = vi.fn() ) {
	const user = userEvent.setup();
	render(
		<StyleSourcesDropdown
			name="core/button"
			attributes={ attributes }
			setAttributes={ setAttributes }
		/>
	);
	await user.click(
		screen.getByRole( 'button', { name: 'Where styles come from' } )
	);
	return user;
}

describe( 'StyleSourcesDropdown', () => {
	it( 'lists changed rows, including one that overrides nothing', async () => {
		await openPopover();

		expect(
			screen.getByText( 'Button, Outline style' )
		).toBeInTheDocument();
		expect(
			screen.getByText( 'Changed on this block (2)' )
		).toBeInTheDocument();
		expect(
			screen.getByText( 'Was Medium, Button element' )
		).toBeInTheDocument();
		expect(
			screen.getByText( 'Not set in Global Styles' )
		).toBeInTheDocument();
	} );

	it( 'lists inherited rows with their real values and sources', async () => {
		await openPopover();

		expect( screen.getByText( 'Not changed (2)' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Font family' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Typography style' ) ).toBeInTheDocument();
		expect( screen.getByText( 'inherit' ) ).toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: /Not changed/ } )
		).not.toBeInTheDocument();
	} );

	it( 'resets one row', async () => {
		const setAttributes = vi.fn();
		const user = await openPopover( setAttributes );

		await user.click(
			screen.getByRole( 'button', { name: 'Reset Letter spacing' } )
		);

		expect( setAttributes ).toHaveBeenCalledWith( {
			style: { css: 'color: red;', typography: { fontSize: '20px' } },
		} );
	} );

	it( 'resets every row, keeping custom CSS', async () => {
		const setAttributes = vi.fn();
		const user = await openPopover( setAttributes );

		await user.click( screen.getByRole( 'button', { name: 'Reset all' } ) );

		expect( setAttributes ).toHaveBeenCalledWith( {
			style: { css: 'color: red;' },
		} );
	} );
} );
