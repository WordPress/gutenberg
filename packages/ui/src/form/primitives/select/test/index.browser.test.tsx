import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { createRef } from '@wordpress/element';
import * as Select from '../index';
import { useEnableWpCompatOverlaySlot } from '../../../../utils/use-enable-wp-compat-overlay-slot';

describe( 'Select', () => {
	it( 'supports object item values', async () => {
		const user = userEvent;
		const onValueChange = vi.fn();
		const users = [
			{ value: '1', label: 'User 1' },
			{ value: '2', label: 'User 2' },
		];

		await render(
			<Select.Root
				defaultValue={ users[ 0 ] }
				items={ users }
				onValueChange={ onValueChange }
			>
				<Select.Trigger>{ ( value ) => value?.label }</Select.Trigger>
				<Select.Popup>
					{ users.map( ( option ) => (
						<Select.Item key={ option.value } value={ option }>
							<Select.ItemLabel>
								{ option.label }
							</Select.ItemLabel>
						</Select.Item>
					) ) }
				</Select.Popup>
			</Select.Root>
		);

		const trigger = screen.getByRole( 'combobox' );

		expect( trigger ).toHaveTextContent( 'User 1' );

		await user.click( trigger );
		await user.click(
			await screen.findByRole( 'option', { name: 'User 2' } )
		);

		expect( trigger ).toHaveTextContent( 'User 2' );
		expect( onValueChange ).toHaveBeenCalledTimes( 1 );
		expect( onValueChange ).toHaveBeenLastCalledWith(
			users[ 1 ],
			expect.objectContaining( { reason: expect.any( String ) } )
		);
	} );

	it( 'forwards ref', async () => {
		const user = userEvent;
		const triggerRef = createRef< HTMLButtonElement >();
		const popupRef = createRef< HTMLDivElement >();
		const itemRef = createRef< HTMLDivElement >();

		await render(
			<Select.Root>
				<Select.Trigger ref={ triggerRef } />
				<Select.Popup ref={ popupRef }>
					<Select.Item ref={ itemRef } value="Item 1">
						<Select.ItemLabel>Item 1</Select.ItemLabel>
					</Select.Item>
					<Select.Item value="Item 2">
						<Select.ItemLabel>Item 2</Select.ItemLabel>
					</Select.Item>
				</Select.Popup>
			</Select.Root>
		);

		// Test trigger ref before interaction
		expect( triggerRef.current ).toBeInstanceOf( HTMLButtonElement );

		// Click on the trigger to open the select dropdown
		await user.click( triggerRef.current! );

		// Now test that the popup and item refs are also available
		expect( popupRef.current ).toBeInstanceOf( HTMLDivElement );
		expect( itemRef.current ).toBeInstanceOf( HTMLDivElement );
	} );

	describe( 'portal', () => {
		it( 'should render inside the portal container when a custom target is provided', async () => {
			const user = userEvent;
			const containerRef = createRef< HTMLDivElement >();

			await render(
				<div data-testid="wrapper">
					<Select.Root>
						<Select.Trigger />
						<div
							ref={ containerRef }
							data-testid="custom-container"
						/>
						<Select.Popup
							portal={
								<Select.Portal container={ containerRef } />
							}
						>
							<Select.Item value="Item 1">
								<Select.ItemLabel>Item 1</Select.ItemLabel>
							</Select.Item>
						</Select.Popup>
					</Select.Root>
				</div>
			);

			await user.click( screen.getByRole( 'combobox' ) );

			const item = await screen.findByRole( 'option', {
				name: 'Item 1',
			} );
			await expect.element( item ).toBeVisible();

			expect( screen.getByTestId( 'custom-container' ) ).toContainElement(
				item
			);
		} );

		it( 'should render with a portal by default', async () => {
			const user = userEvent;

			await render(
				<div data-testid="wrapper">
					<Select.Root>
						<Select.Trigger />
						<Select.Popup>
							<Select.Item value="Item 1">
								<Select.ItemLabel>Item 1</Select.ItemLabel>
							</Select.Item>
						</Select.Popup>
					</Select.Root>
				</div>
			);

			await user.click( screen.getByRole( 'combobox' ) );

			const item = await screen.findByRole( 'option', {
				name: 'Item 1',
			} );
			await expect.element( item ).toBeVisible();

			expect( screen.getByTestId( 'wrapper' ) ).not.toContainElement(
				item
			);
		} );
	} );

	describe( 'positioner', () => {
		it( 'should render the custom positioner element wrapping the popup content', async () => {
			const user = userEvent;

			await render(
				<Select.Root>
					<Select.Trigger />
					<Select.Popup
						positioner={
							<Select.Positioner data-testid="custom-positioner" />
						}
					>
						<Select.Item value="Item 1">
							<Select.ItemLabel>Item 1</Select.ItemLabel>
						</Select.Item>
					</Select.Popup>
				</Select.Root>
			);

			await user.click( screen.getByRole( 'combobox' ) );

			const item = await screen.findByRole( 'option', {
				name: 'Item 1',
			} );
			const positioner = screen.getByTestId( 'custom-positioner' );

			expect( positioner ).toContainElement( item );
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
					<Select.Root>
						<Select.Trigger />
						<Select.Popup>
							<Select.Item value="Item 1">
								<Select.ItemLabel>Item 1</Select.ItemLabel>
							</Select.Item>
						</Select.Popup>
					</Select.Root>
				</WithSlotEnabled>
			);

			await user.click( screen.getByRole( 'combobox' ) );

			const item = await screen.findByRole( 'option', {
				name: 'Item 1',
			} );
			await expect.element( item ).toBeVisible();

			const slot = document.querySelector( SLOT_SELECTOR );
			expect( slot ).not.toBeNull();
			expect( slot ).toContainElement( item );
		} );

		it( 'does not create a slot when the consumer has not opted in (dormant default)', async () => {
			const user = userEvent;

			await render(
				<Select.Root>
					<Select.Trigger />
					<Select.Popup>
						<Select.Item value="Item 1">
							<Select.ItemLabel>Item 1</Select.ItemLabel>
						</Select.Item>
					</Select.Popup>
				</Select.Root>
			);

			await user.click( screen.getByRole( 'combobox' ) );

			const item = await screen.findByRole( 'option', {
				name: 'Item 1',
			} );
			await expect.element( item ).toBeVisible();

			expect( document.querySelector( SLOT_SELECTOR ) ).toBeNull();
		} );

		it( 'lets a caller-supplied portal container override the slot', async () => {
			const user = userEvent;
			const containerRef = createRef< HTMLDivElement >();

			await render(
				<WithSlotEnabled>
					<Select.Root>
						<Select.Trigger />
						<div
							ref={ containerRef }
							data-testid="custom-container"
						/>
						<Select.Popup
							portal={
								<Select.Portal container={ containerRef } />
							}
						>
							<Select.Item value="Item 1">
								<Select.ItemLabel>Item 1</Select.ItemLabel>
							</Select.Item>
						</Select.Popup>
					</Select.Root>
				</WithSlotEnabled>
			);

			await user.click( screen.getByRole( 'combobox' ) );

			const item = await screen.findByRole( 'option', {
				name: 'Item 1',
			} );
			await expect.element( item ).toBeVisible();
			expect( screen.getByTestId( 'custom-container' ) ).toContainElement(
				item
			);
		} );
	} );
	/* eslint-enable testing-library/no-node-access */

	describe( 'grouped items', () => {
		const GROUPED_ITEMS = [
			{
				label: 'Group 1',
				items: [
					{ value: 'item-1', label: 'Item 1' },
					{ value: 'item-2', label: 'Item 2' },
				],
			},
			{
				label: 'Group 2',
				items: [ { value: 'item-3', label: 'Item 3' } ],
			},
		];

		it( 'forwards refs', async () => {
			const user = userEvent;
			const groupRef = createRef< HTMLDivElement >();
			const groupLabelRef = createRef< HTMLDivElement >();

			await render(
				<Select.Root
					items={ GROUPED_ITEMS.flatMap( ( group ) => group.items ) }
				>
					<Select.Trigger />
					<Select.Popup>
						{ GROUPED_ITEMS.map( ( group ) => (
							<Select.Group
								key={ group.label }
								ref={
									group.label === 'Group 1'
										? groupRef
										: undefined
								}
							>
								<Select.GroupLabel
									ref={
										group.label === 'Group 1'
											? groupLabelRef
											: undefined
									}
								>
									{ group.label }
								</Select.GroupLabel>
								{ group.items.map( ( item ) => (
									<Select.Item
										key={ item.value }
										value={ item }
									>
										<Select.ItemLabel>
											{ item.label }
										</Select.ItemLabel>
									</Select.Item>
								) ) }
							</Select.Group>
						) ) }
					</Select.Popup>
				</Select.Root>
			);

			await user.click( screen.getByRole( 'combobox' ) );

			expect( groupRef.current ).toBeInstanceOf( HTMLDivElement );
			expect( groupLabelRef.current ).toBeInstanceOf( HTMLDivElement );
		} );
	} );
} );
