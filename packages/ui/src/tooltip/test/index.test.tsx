import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';
import * as Tooltip from '../index';

describe( 'Tooltip', () => {
	it( 'forwards ref', async () => {
		const user = userEvent.setup();
		const triggerRef = createRef< HTMLButtonElement >();
		const popupRef = createRef< HTMLDivElement >();

		render(
			<Tooltip.Provider delay={ 0 }>
				<Tooltip.Root>
					<Tooltip.Trigger ref={ triggerRef }>
						<span>Hover me</span>
					</Tooltip.Trigger>
					<Tooltip.Popup ref={ popupRef }>Tooltip text</Tooltip.Popup>
				</Tooltip.Root>
			</Tooltip.Provider>
		);

		// Test trigger ref before interaction
		expect( triggerRef.current ).toBeInstanceOf( HTMLButtonElement );

		// Hover over the trigger to open the tooltip
		await user.hover( triggerRef.current! );

		// Wait for the tooltip popup to appear
		await waitFor( () => {
			expect( popupRef.current ).toBeInstanceOf( HTMLDivElement );
		} );
	} );

	it( 'shows tooltip on hover', async () => {
		const user = userEvent.setup();

		render(
			<Tooltip.Provider delay={ 0 }>
				<Tooltip.Root>
					<Tooltip.Trigger>Hover me</Tooltip.Trigger>
					<Tooltip.Popup>Tooltip content</Tooltip.Popup>
				</Tooltip.Root>
			</Tooltip.Provider>
		);

		const trigger = screen.getByRole( 'button', { name: 'Hover me' } );
		await user.hover( trigger );

		await waitFor( () => {
			expect( screen.getByText( 'Tooltip content' ) ).toBeVisible();
		} );
	} );

	it( 'does not show tooltip when disabled', async () => {
		const user = userEvent.setup();

		render(
			<Tooltip.Provider delay={ 0 }>
				<Tooltip.Root disabled>
					<Tooltip.Trigger>Hover me</Tooltip.Trigger>
					<Tooltip.Popup>Tooltip content</Tooltip.Popup>
				</Tooltip.Root>
			</Tooltip.Provider>
		);

		const trigger = screen.getByRole( 'button', { name: 'Hover me' } );
		await user.hover( trigger );

		expect(
			screen.queryByText( 'Tooltip content' )
		).not.toBeInTheDocument();
	} );
} );
