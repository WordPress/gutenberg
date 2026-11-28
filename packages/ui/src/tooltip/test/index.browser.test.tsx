import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { createRef } from '@wordpress/element';
import type { ProviderProps } from '../types';
import * as Tooltip from '../index';
import { useEnableWpCompatOverlaySlot } from '../../utils/use-enable-wp-compat-overlay-slot';

// Test wrapper that sets delay={0} to avoid real-time delays in tests.
function TestProvider( { children, ...props }: ProviderProps ) {
	return (
		<Tooltip.Provider delay={ 0 } { ...props }>
			{ children }
		</Tooltip.Provider>
	);
}

describe( 'Tooltip', () => {
	it( 'shows tooltip on hover', async () => {
		await render(
			<Tooltip.Provider delay={ 0 }>
				<Tooltip.Root>
					<Tooltip.Trigger>Hover me</Tooltip.Trigger>
					<Tooltip.Popup>Tooltip content</Tooltip.Popup>
				</Tooltip.Root>
			</Tooltip.Provider>
		);

		await page.getByRole( 'button', { name: 'Hover me' } ).hover();
		await expect
			.element( page.getByText( 'Tooltip content' ) )
			.toBeVisible();
	} );

	it( 'does not show tooltip when disabled', async () => {
		await render(
			<Tooltip.Provider delay={ 0 }>
				<Tooltip.Root disabled>
					<Tooltip.Trigger>Hover me</Tooltip.Trigger>
					<Tooltip.Popup>Tooltip content</Tooltip.Popup>
				</Tooltip.Root>
			</Tooltip.Provider>
		);

		await page.getByRole( 'button', { name: 'Hover me' } ).hover();
		await expect
			.element( page.getByText( 'Tooltip content' ) )
			.not.toBeInTheDocument();
	} );
	it( 'forwards ref', async () => {
		const user = userEvent;
		const triggerRef = createRef< HTMLButtonElement >();
		const popupRef = createRef< HTMLDivElement >();

		await render(
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

	describe( 'portal', () => {
		it( 'should render inside the portal container when a custom target is provided', async () => {
			const user = userEvent;
			const containerRef = createRef< HTMLDivElement >();

			await render(
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
			await expect.element( content ).toBeVisible();

			expect( screen.getByTestId( 'custom-container' ) ).toContainElement(
				content
			);
		} );

		it( 'should render with a portal by default', async () => {
			const user = userEvent;

			await render(
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
			await expect.element( content ).toBeVisible();

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
			const user = userEvent;

			await render(
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
			await expect.element( content ).toBeVisible();

			const slot = document.querySelector( SLOT_SELECTOR );
			expect( slot ).not.toBeNull();
			expect( slot ).toContainElement( content );
		} );

		it( 'does not create a slot when the consumer has not opted in (dormant default)', async () => {
			const user = userEvent;

			await render(
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
			await expect.element( content ).toBeVisible();

			expect( document.querySelector( SLOT_SELECTOR ) ).toBeNull();
		} );

		it( 'lets a caller-supplied portal container override the slot', async () => {
			const user = userEvent;
			const containerRef = createRef< HTMLDivElement >();

			await render(
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
			await expect.element( content ).toBeVisible();
			expect( screen.getByTestId( 'custom-container' ) ).toContainElement(
				content
			);
		} );
	} );
	/* eslint-enable testing-library/no-node-access */
} );
