import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';
import * as Tooltip from '../index';
import type { ProviderProps } from '../types';

// Test wrapper that sets delay={0} to avoid real-time delays in tests.
function TestProvider( { children, ...props }: ProviderProps ) {
	return (
		<Tooltip.Provider delay={ 0 } { ...props }>
			{ children }
		</Tooltip.Provider>
	);
}

describe( 'Tooltip', () => {
	it( 'forwards ref', async () => {
		const user = userEvent.setup();
		const triggerRef = createRef< HTMLButtonElement >();
		const popupRef = createRef< HTMLDivElement >();

		render(
			<TestProvider>
				<Tooltip.Root>
					<Tooltip.Trigger ref={ triggerRef }>
						<span>Hover me</span>
					</Tooltip.Trigger>
					<Tooltip.Popup ref={ popupRef }>Tooltip text</Tooltip.Popup>
				</Tooltip.Root>
			</TestProvider>
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
			<TestProvider>
				<Tooltip.Root>
					<Tooltip.Trigger>Hover me</Tooltip.Trigger>
					<Tooltip.Popup>Tooltip content</Tooltip.Popup>
				</Tooltip.Root>
			</TestProvider>
		);

		const trigger = screen.getByRole( 'button', { name: 'Hover me' } );
		await user.hover( trigger );

		// waitFor is used intentionally: even with delay={0}, the popup appearing
		// is conceptually async (state change → render → portal mount). This also
		// makes the test resilient to future internal changes in base-ui.
		await waitFor( () => {
			expect( screen.getByText( 'Tooltip content' ) ).toBeVisible();
		} );
	} );

	it( 'does not show tooltip when disabled', async () => {
		const user = userEvent.setup();

		render(
			<TestProvider>
				<Tooltip.Root disabled>
					<Tooltip.Trigger>Hover me</Tooltip.Trigger>
					<Tooltip.Popup>Tooltip content</Tooltip.Popup>
				</Tooltip.Root>
			</TestProvider>
		);

		const trigger = screen.getByRole( 'button', { name: 'Hover me' } );
		await user.hover( trigger );

		expect(
			screen.queryByText( 'Tooltip content' )
		).not.toBeInTheDocument();
	} );
} );
