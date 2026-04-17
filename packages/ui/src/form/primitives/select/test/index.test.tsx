import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';
import * as Select from '../index';

describe( 'Select', () => {
	it( 'forwards ref', async () => {
		const user = userEvent.setup();
		const triggerRef = createRef< HTMLButtonElement >();
		const popupRef = createRef< HTMLDivElement >();
		const itemRef = createRef< HTMLDivElement >();

		render(
			<Select.Root>
				<Select.Trigger ref={ triggerRef } />
				<Select.Popup ref={ popupRef }>
					<Select.Item ref={ itemRef } value="Item 1" />
					<Select.Item value="Item 2" />
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

	describe( 'container', () => {
		it( 'should render inside the container when provided', async () => {
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
						<Select.Popup container={ containerRef }>
							<Select.Item value="Item 1" />
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
							<Select.Item value="Item 1" />
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
} );
