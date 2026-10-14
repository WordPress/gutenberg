import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from '@wordpress/element';
import StyleSourcesDropdown from '../style-sources-dropdown';

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

const rows = { changed: changedRows };

vi.mock( import( '../use-style-source-rows' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useStyleSourceRows: () => ( {
		changed: rows.changed,
		inherited: [
			{
				id: 'typography.fontFamily',
				label: 'Font family',
				value: 'Serif',
				sourceLabel: 'Site typography',
			},
			{
				id: 'typography.fontWeight',
				label: 'Font weight',
				value: '600',
				sourceLabel: 'Button block',
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

function renderDropdown( setAttributes = vi.fn() ) {
	render(
		<StyleSourcesDropdown
			name="core/button"
			attributes={ attributes }
			setAttributes={ setAttributes }
		/>
	);
}

async function openPopover( setAttributes = vi.fn() ) {
	const user = userEvent.setup();
	renderDropdown( setAttributes );
	await user.click(
		screen.getByRole( 'button', { name: 'See 2 style changes' } )
	);
	return user;
}

describe( 'StyleSourcesDropdown', () => {
	it( 'hides the link when nothing is changed on the block', () => {
		rows.changed = [];
		renderDropdown();
		rows.changed = changedRows;

		expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
	} );

	it( 'lists changed rows, including one that overrides nothing', async () => {
		await openPopover();

		expect( screen.getByText( 'Style changes' ) ).toBeInTheDocument();
		expect(
			screen.getByText( 'Changed on this block (2)' )
		).toBeInTheDocument();
		expect(
			screen.getByText( 'Was Medium · Button element' )
		).toBeInTheDocument();
		expect(
			screen.getByText( 'Not set in Global Styles' )
		).toBeInTheDocument();
	} );

	it( 'lists inherited rows with their real values and sources', async () => {
		await openPopover();

		expect(
			screen.getByText( 'Inherited styles (2)' )
		).toBeInTheDocument();
		expect( screen.getByText( 'Font family' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Site typography' ) ).toBeInTheDocument();
		expect( screen.getByText( '600' ) ).toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: /Inherited styles/ } )
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

	it( 'keeps focus in the popover once the last change is reset', async () => {
		// Resets empty the rows, as the real hook would after the update.
		function Block() {
			const [ blockAttributes, setBlockAttributes ] =
				useState( attributes );
			return (
				<StyleSourcesDropdown
					name="core/button"
					attributes={ blockAttributes }
					setAttributes={ ( next ) => {
						rows.changed = [];
						setBlockAttributes( { ...blockAttributes, ...next } );
					} }
				/>
			);
		}
		const user = userEvent.setup();
		render( <Block /> );
		await user.click(
			screen.getByRole( 'button', { name: 'See 2 style changes' } )
		);

		await user.click( screen.getByRole( 'button', { name: 'Reset all' } ) );
		rows.changed = changedRows;

		expect(
			screen.getByRole( 'heading', { name: 'Changed on this block (0)' } )
		).toHaveFocus();
		expect(
			screen.queryByRole( 'button', { name: 'Reset all' } )
		).not.toBeInTheDocument();
	} );
} );
