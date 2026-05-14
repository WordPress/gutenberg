import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';
import * as Select from '../index';

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

		const placeholder = screen.getByText( 'Select' );

		expect( screen.getByRole( 'combobox' ) ).toHaveTextContent( 'Select' );
		expect( placeholder ).toHaveAttribute( 'data-placeholder' );
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

		const placeholder = screen.getByText( 'Choose an item' );

		expect( screen.getByRole( 'combobox' ) ).toHaveTextContent(
			'Choose an item'
		);
		expect( placeholder ).toHaveAttribute( 'data-placeholder' );
	} );

	it( 'does not use placeholder styling when a value is selected', () => {
		render(
			<Select.Root defaultValue="Item 1">
				<Select.Trigger />
				<Select.Popup>
					<Select.Item value="Item 1" />
				</Select.Popup>
			</Select.Root>
		);

		const trigger = screen.getByRole( 'combobox' );

		expect( trigger ).toHaveTextContent( 'Item 1' );
		expect( within( trigger ).getByText( 'Item 1' ) ).not.toHaveAttribute(
			'data-placeholder'
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
} );
