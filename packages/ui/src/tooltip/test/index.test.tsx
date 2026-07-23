import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';
import type { ReactNode } from 'react';
import * as Tooltip from '../index';
import { useEnableWpCompatOverlaySlot } from '../../utils/use-enable-wp-compat-overlay-slot';
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

	describe( 'portal', () => {
		it( 'should render inside the portal container when a custom target is provided', async () => {
			const user = userEvent.setup();
			const containerRef = createRef< HTMLDivElement >();

			render(
				<TestProvider>
					<div data-testid="wrapper">
						<Tooltip.Root>
							<Tooltip.Trigger>Hover me</Tooltip.Trigger>
							<div
								ref={ containerRef }
								data-testid="custom-container"
							/>
							<Tooltip.Popup
								portal={
									<Tooltip.Portal
										container={ containerRef }
									/>
								}
							>
								Tooltip content
							</Tooltip.Popup>
						</Tooltip.Root>
					</div>
				</TestProvider>
			);

			await user.hover(
				screen.getByRole( 'button', { name: 'Hover me' } )
			);

			const content = await screen.findByText( 'Tooltip content' );
			expect( content ).toBeVisible();

			expect( screen.getByTestId( 'custom-container' ) ).toContainElement(
				content
			);
		} );

		it( 'should render with a portal by default', async () => {
			const user = userEvent.setup();

			render(
				<TestProvider>
					<div data-testid="wrapper">
						<Tooltip.Root>
							<Tooltip.Trigger>Hover me</Tooltip.Trigger>
							<Tooltip.Popup>Tooltip content</Tooltip.Popup>
						</Tooltip.Root>
					</div>
				</TestProvider>
			);

			await user.hover(
				screen.getByRole( 'button', { name: 'Hover me' } )
			);

			const content = await screen.findByText( 'Tooltip content' );
			expect( content ).toBeVisible();

			expect( screen.getByTestId( 'wrapper' ) ).not.toContainElement(
				content
			);
		} );
	} );

	// Slot is identified by a data attribute, not a user-facing role/text.
	/* eslint-disable testing-library/no-node-access */
	describe( 'wp compat overlay slot', () => {
		const SLOT_SELECTOR = '[data-wp-compat-overlay-slot]';

		// Exercises the public opt-in path rather than poking the flag.
		function WithSlotEnabled( { children }: { children: ReactNode } ) {
			useEnableWpCompatOverlaySlot();
			return <>{ children }</>;
		}

		afterEach( () => {
			// The hook is one-way at runtime; reset explicitly between tests.
			delete ( window as { __wpUiCompatOverlaySlotEnabled?: boolean } )
				.__wpUiCompatOverlaySlotEnabled;
			document
				.querySelectorAll( SLOT_SELECTOR )
				.forEach( ( el ) => el.remove() );
		} );

		it( 'portals the popup into the slot when the consumer opts in', async () => {
			const user = userEvent.setup();

			render(
				<WithSlotEnabled>
					<TestProvider>
						<Tooltip.Root>
							<Tooltip.Trigger>Hover me</Tooltip.Trigger>
							<Tooltip.Popup>Tooltip content</Tooltip.Popup>
						</Tooltip.Root>
					</TestProvider>
				</WithSlotEnabled>
			);

			await user.hover(
				screen.getByRole( 'button', { name: 'Hover me' } )
			);

			const content = await screen.findByText( 'Tooltip content' );
			expect( content ).toBeVisible();

			const slot = document.querySelector( SLOT_SELECTOR );
			expect( slot ).not.toBeNull();
			expect( slot ).toContainElement( content );
		} );

		it( 'does not create a slot when the consumer has not opted in (dormant default)', async () => {
			const user = userEvent.setup();

			render(
				<TestProvider>
					<Tooltip.Root>
						<Tooltip.Trigger>Hover me</Tooltip.Trigger>
						<Tooltip.Popup>Tooltip content</Tooltip.Popup>
					</Tooltip.Root>
				</TestProvider>
			);

			await user.hover(
				screen.getByRole( 'button', { name: 'Hover me' } )
			);

			const content = await screen.findByText( 'Tooltip content' );
			expect( content ).toBeVisible();

			expect( document.querySelector( SLOT_SELECTOR ) ).toBeNull();
		} );

		it( 'lets a caller-supplied portal container override the slot', async () => {
			const user = userEvent.setup();
			const containerRef = createRef< HTMLDivElement >();

			render(
				<WithSlotEnabled>
					<TestProvider>
						<Tooltip.Root>
							<Tooltip.Trigger>Hover me</Tooltip.Trigger>
							<div
								ref={ containerRef }
								data-testid="custom-container"
							/>
							<Tooltip.Popup
								portal={
									<Tooltip.Portal
										container={ containerRef }
									/>
								}
							>
								Tooltip content
							</Tooltip.Popup>
						</Tooltip.Root>
					</TestProvider>
				</WithSlotEnabled>
			);

			await user.hover(
				screen.getByRole( 'button', { name: 'Hover me' } )
			);

			const content = await screen.findByText( 'Tooltip content' );
			expect( content ).toBeVisible();
			expect( screen.getByTestId( 'custom-container' ) ).toContainElement(
				content
			);
		} );
	} );
	/* eslint-enable testing-library/no-node-access */
} );
