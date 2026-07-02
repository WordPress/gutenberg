import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';
import type { ReactNode } from 'react';
import * as Select from '../index';
import { useEnableWpCompatOverlaySlot } from '../../../../utils/use-enable-wp-compat-overlay-slot';

describe( 'Select', () => {
	it( 'supports object item values', async () => {
		const user = userEvent.setup();
		const onValueChange = jest.fn();
		const users = [
			{ value: '1', label: 'User 1' },
			{ value: '2', label: 'User 2' },
		];

		render(
			<Select.Root
				defaultValue={ users[ 0 ] }
				items={ users }
				onValueChange={ onValueChange }
			>
				<Select.Trigger>{ ( value ) => value?.label }</Select.Trigger>
				<Select.Popup>
					{ users.map( ( option ) => (
						<Select.Item key={ option.value } value={ option }>
							{ option.label }
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

	it( 'auto-resolves trigger label from items when value is an object', () => {
		const users = [
			{ value: '1', label: 'User 1' },
			{ value: '2', label: 'User 2' },
		];

		render(
			<Select.Root defaultValue={ users[ 0 ] } items={ users }>
				<Select.Trigger />
				<Select.Popup>
					{ users.map( ( option ) => (
						<Select.Item key={ option.value } value={ option }>
							{ option.label }
						</Select.Item>
					) ) }
				</Select.Popup>
			</Select.Root>
		);

		expect( screen.getByRole( 'combobox' ) ).toHaveTextContent( 'User 1' );
	} );

	it( 'renders a default placeholder when no value is selected', () => {
		render(
			<Select.Root>
				<Select.Trigger />
				<Select.Popup>
					<Select.Item value="Item 1" />
				</Select.Popup>
			</Select.Root>
		);

		expect( screen.getByRole( 'combobox' ) ).toHaveTextContent( 'Select' );
	} );

	it( 'supports custom placeholder text', () => {
		render(
			<Select.Root>
				<Select.Trigger placeholder="Choose an item" />
				<Select.Popup>
					<Select.Item value="Item 1" />
				</Select.Popup>
			</Select.Root>
		);

		expect( screen.getByRole( 'combobox' ) ).toHaveTextContent(
			'Choose an item'
		);
	} );

	it( 'forwards ref', async () => {
		const user = userEvent.setup();
		const triggerRef = createRef< HTMLButtonElement >();
		const popupRef = createRef< HTMLDivElement >();
		const itemRef = createRef< HTMLDivElement >();

		render(
			<Select.Root>
				<Select.Trigger ref={ triggerRef } />
				<Select.Popup ref={ popupRef }>
					<Select.Item ref={ itemRef } value="Item 1">
						Item 1
					</Select.Item>
					<Select.Item value="Item 2">Item 2</Select.Item>
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
			const user = userEvent.setup();
			const containerRef = createRef< HTMLDivElement >();

			render(
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
							<Select.Item value="Item 1">Item 1</Select.Item>
						</Select.Popup>
					</Select.Root>
				</div>
			);

			await user.click( screen.getByRole( 'combobox' ) );

			const item = await screen.findByRole( 'option', {
				name: 'Item 1',
			} );
			expect( item ).toBeVisible();

			expect( screen.getByTestId( 'custom-container' ) ).toContainElement(
				item
			);
		} );

		it( 'should render with a portal by default', async () => {
			const user = userEvent.setup();

			render(
				<div data-testid="wrapper">
					<Select.Root>
						<Select.Trigger />
						<Select.Popup>
							<Select.Item value="Item 1">Item 1</Select.Item>
						</Select.Popup>
					</Select.Root>
				</div>
			);

			await user.click( screen.getByRole( 'combobox' ) );

			const item = await screen.findByRole( 'option', {
				name: 'Item 1',
			} );
			expect( item ).toBeVisible();

			expect( screen.getByTestId( 'wrapper' ) ).not.toContainElement(
				item
			);
		} );
	} );

	describe( 'positioner', () => {
		it( 'should render the custom positioner element wrapping the popup content', async () => {
			const user = userEvent.setup();

			render(
				<Select.Root>
					<Select.Trigger />
					<Select.Popup
						positioner={
							<Select.Positioner data-testid="custom-positioner" />
						}
					>
						<Select.Item value="Item 1">Item 1</Select.Item>
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
			const user = userEvent.setup();

			render(
				<WithSlotEnabled>
					<Select.Root>
						<Select.Trigger />
						<Select.Popup>
							<Select.Item value="Item 1">Item 1</Select.Item>
						</Select.Popup>
					</Select.Root>
				</WithSlotEnabled>
			);

			await user.click( screen.getByRole( 'combobox' ) );

			const item = await screen.findByRole( 'option', {
				name: 'Item 1',
			} );
			expect( item ).toBeVisible();

			const slot = document.querySelector( SLOT_SELECTOR );
			expect( slot ).not.toBeNull();
			expect( slot ).toContainElement( item );
		} );

		it( 'does not create a slot when the consumer has not opted in (dormant default)', async () => {
			const user = userEvent.setup();

			render(
				<Select.Root>
					<Select.Trigger />
					<Select.Popup>
						<Select.Item value="Item 1">Item 1</Select.Item>
					</Select.Popup>
				</Select.Root>
			);

			await user.click( screen.getByRole( 'combobox' ) );

			const item = await screen.findByRole( 'option', {
				name: 'Item 1',
			} );
			expect( item ).toBeVisible();

			expect( document.querySelector( SLOT_SELECTOR ) ).toBeNull();
		} );

		it( 'lets a caller-supplied portal container override the slot', async () => {
			const user = userEvent.setup();
			const containerRef = createRef< HTMLDivElement >();

			render(
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
							<Select.Item value="Item 1">Item 1</Select.Item>
						</Select.Popup>
					</Select.Root>
				</WithSlotEnabled>
			);

			await user.click( screen.getByRole( 'combobox' ) );

			const item = await screen.findByRole( 'option', {
				name: 'Item 1',
			} );
			expect( item ).toBeVisible();
			expect( screen.getByTestId( 'custom-container' ) ).toContainElement(
				item
			);
		} );
	} );
	/* eslint-enable testing-library/no-node-access */
} );
