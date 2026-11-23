import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { getWpCompatOverlaySlot } from '@wordpress/ui';
import BoxControl from '..';

function getTooltip() {
	return page
		.elementLocator( getWpCompatOverlaySlot()! )
		.getByText( 'All sides' );
}

async function focusUnitSelectWithoutFocusingInput() {
	(
		page
			.getByRole( 'slider', { name: 'All sides' } )
			.element() as HTMLElement
	 ).focus();
	await userEvent.tab( { shift: true } );
}

describe( 'BoxControl', () => {
	describe( 'Side input tooltip', () => {
		it( 'should show the tooltip when the input receives focus', async () => {
			await render( <BoxControl onChange={ () => {} } /> );

			await userEvent.tab();

			await expect
				.element( page.getByRole( 'textbox', { name: 'All sides' } ) )
				.toHaveFocus();
			await expect.element( getTooltip() ).toBeVisible();
		} );

		it( 'should show the tooltip when `inputProps` includes an `id`', async () => {
			await render(
				<BoxControl
					inputProps={ { id: 'custom-side' } }
					onChange={ () => {} }
				/>
			);

			await userEvent.tab();

			await expect.element( getTooltip() ).toBeVisible();
			const input = page
				.getByRole( 'textbox', { name: 'All sides' } )
				.element();
			await expect
				.element( page.getByRole( 'slider', { name: 'All sides' } ) )
				.toHaveAttribute( 'aria-controls', input.id );
		} );

		it( 'should not show the tooltip when the unit select receives focus', async () => {
			await render( <BoxControl onChange={ () => {} } /> );

			await focusUnitSelectWithoutFocusingInput();

			await expect
				.element(
					page.getByRole( 'combobox', { name: 'Select unit' } )
				)
				.toHaveFocus();
			await expect.element( getTooltip() ).not.toBeInTheDocument();
		} );
	} );
} );
