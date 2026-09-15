import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { BorderBoxControl } from '..';

// Borders that differ between sides start the control unlinked, which is what
// renders the four split controls.
const mixedBorders = {
	top: { color: '#f6f7f7', style: 'solid', width: '1px' },
	right: { color: '#e65054', style: 'dashed', width: '2px' },
	bottom: { color: '#00a32a', style: 'dotted', width: '3px' },
	left: { color: '#bd8600', style: 'solid', width: '4px' },
};

// The split controls grid fills the width it is given, so the test wrapper
// stands in for the row the four controls are laid out across.
const ROW_WIDTH = 360;

// Sub-pixel tolerance for fractional grid tracks.
const expectClose = ( actual: number, expected: number ) =>
	expect( Math.abs( actual - expected ) ).toBeLessThanOrEqual( 1 );

describe( 'BorderBoxControl split controls layout', () => {
	const renderSplitControls = async () => {
		await render(
			<div data-testid="row" style={ { width: `${ ROW_WIDTH }px` } }>
				<BorderBoxControl
					label="Borders"
					onChange={ () => {} }
					value={ mixedBorders }
				/>
			</div>
		);

		const control = ( name: string ) =>
			screen.getByRole( 'group', { name } ).getBoundingClientRect();

		return {
			row: screen.getByTestId( 'row' ).getBoundingClientRect(),
			top: control( 'Top border' ),
			left: control( 'Left border' ),
			right: control( 'Right border' ),
			bottom: control( 'Bottom border' ),
		};
	};

	it( 'centres the top and bottom controls across the row rather than filling it', async () => {
		const { row, top, bottom } = await renderSplitControls();

		// Both span the full two-column row, so centring is only visible while
		// they stay narrower than it.
		expect( top.width ).toBeLessThan( row.width );
		expect( bottom.width ).toBeLessThan( row.width );

		expectClose( top.left - row.left, row.right - top.right );
		expectClose( bottom.left - row.left, row.right - bottom.right );
	} );

	it( 'pushes the right control to the end of its column rather than filling it', async () => {
		const { row, left, right } = await renderSplitControls();

		// The left control has no auto margin and so fills its column, which
		// makes it a stand-in for the column width.
		expect( right.width ).toBeLessThan( left.width );

		expectClose( right.right, row.right );
		expectClose( left.left, row.left );
	} );

	it( 'stacks the controls as top, then left and right, then bottom', async () => {
		const { top, left, right, bottom } = await renderSplitControls();

		expect( left.top ).toBeGreaterThanOrEqual( top.bottom );
		expectClose( left.top, right.top );
		expect( bottom.top ).toBeGreaterThanOrEqual( left.bottom );
	} );
} );
