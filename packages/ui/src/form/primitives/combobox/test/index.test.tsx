import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';
import * as Combobox from '../index';

const ITEMS = [
	{ id: '1', value: 'Item 1' },
	{ id: '2', value: 'Item 2' },
	{ id: '3', value: 'Item 3' },
];

type Item = ( typeof ITEMS )[ number ];

function renderDisabledMultiSelect() {
	return render(
		<Combobox.Root< Item, true >
			items={ ITEMS }
			multiple
			disabled
			defaultValue={ [ ITEMS[ 0 ] ] }
		>
			<Combobox.Chips>
				<Combobox.Value>
					{ ( value: Item[] ) => (
						<>
							{ value.map( ( item ) => (
								<Combobox.ChipWithRemove key={ item.id }>
									{ item.value }
								</Combobox.ChipWithRemove>
							) ) }
							<Combobox.Clear />
						</>
					) }
				</Combobox.Value>
			</Combobox.Chips>
			<Combobox.Popup>
				<Combobox.List>
					<Combobox.ListBody>
						<Combobox.Collection>
							{ ( item ) => (
								<Combobox.Item key={ item.id } value={ item }>
									{ item.value }
								</Combobox.Item>
							) }
						</Combobox.Collection>
					</Combobox.ListBody>
				</Combobox.List>
			</Combobox.Popup>
		</Combobox.Root>
	);
}

describe( 'Combobox', () => {
	it( 'forwards ref', async () => {
		const user = userEvent.setup();
		const triggerRef = createRef< HTMLButtonElement >();
		const popupRef = createRef< HTMLDivElement >();
		const inputRef = createRef< HTMLInputElement >();
		const listRef = createRef< HTMLDivElement >();
		const listBodyRef = createRef< HTMLDivElement >();
		const listFooterRef = createRef< HTMLDivElement >();
		const itemRef = createRef< HTMLDivElement >();
		const chipsRef = createRef< HTMLDivElement >();
		const chipWithRemoveRef = createRef< HTMLDivElement >();
		const clearRef = createRef< HTMLButtonElement >();
		const emptyRef = createRef< HTMLDivElement >();

		render(
			<Combobox.Root items={ ITEMS } defaultValue={ ITEMS[ 0 ] }>
				<Combobox.Trigger ref={ triggerRef } />
				<Combobox.Popup ref={ popupRef }>
					<Combobox.Input ref={ inputRef } placeholder="Search" />
					<Combobox.Value>
						<Combobox.Chips ref={ chipsRef }>
							<Combobox.ChipWithRemove
								ref={ chipWithRemoveRef }
							></Combobox.ChipWithRemove>
							<Combobox.Clear ref={ clearRef } />
						</Combobox.Chips>
					</Combobox.Value>
					<Combobox.Empty ref={ emptyRef }>
						No results found.
					</Combobox.Empty>
					<Combobox.List ref={ listRef }>
						<Combobox.ListBody ref={ listBodyRef }>
							<Combobox.Collection>
								{ ( item ) => (
									<Combobox.Item
										key={ item.id }
										ref={
											item.id === '1'
												? itemRef
												: undefined
										}
										value={ item }
									>
										{ item.value }
									</Combobox.Item>
								) }
							</Combobox.Collection>
						</Combobox.ListBody>
						<Combobox.ListFooter ref={ listFooterRef } />
					</Combobox.List>
				</Combobox.Popup>
			</Combobox.Root>
		);

		// Test trigger ref before interaction
		expect( triggerRef.current ).toBeInstanceOf( HTMLButtonElement );

		// Click on the trigger to open the combobox popup
		await user.click( triggerRef.current! );

		// Now test that the popup and its child component refs are also available
		await waitFor( () => {
			expect( popupRef.current ).toBeInstanceOf( HTMLDivElement );
		} );
		expect( inputRef.current ).toBeInstanceOf( HTMLInputElement );
		expect( listRef.current ).toBeInstanceOf( HTMLDivElement );
		expect( listBodyRef.current ).toBeInstanceOf( HTMLDivElement );
		expect( listFooterRef.current ).toBeInstanceOf( HTMLDivElement );
		expect( itemRef.current ).toBeInstanceOf( HTMLDivElement );
		expect( chipsRef.current ).toBeInstanceOf( HTMLDivElement );
		expect( chipWithRemoveRef.current ).toBeInstanceOf( HTMLDivElement );
		expect( clearRef.current ).toBeInstanceOf( HTMLButtonElement );
		expect( emptyRef.current ).toBeInstanceOf( HTMLDivElement );
	} );

	// The actual bug is a CSS grid overlap: both Empty and List target
	// `grid-area: main`, so Empty rendered later in DOM stacks on top and
	// blocks clicks. JSDOM doesn't compute CSS layout, so this test only
	// verifies the behavioral contract, not the CSS fix itself.
	it( 'allows selecting items when Empty is rendered after List', async () => {
		const user = userEvent.setup();
		const onValueChange = jest.fn();

		render(
			<Combobox.Root
				items={ ITEMS }
				defaultValue={ ITEMS[ 0 ] }
				onValueChange={ onValueChange }
			>
				<Combobox.Trigger />
				<Combobox.Popup>
					<Combobox.Input placeholder="Search" />
					<Combobox.List>
						<Combobox.ListBody>
							<Combobox.Collection>
								{ ( item ) => (
									<Combobox.Item
										key={ item.id }
										value={ item }
									>
										{ item.value }
									</Combobox.Item>
								) }
							</Combobox.Collection>
						</Combobox.ListBody>
					</Combobox.List>
					<Combobox.Empty>No results found.</Combobox.Empty>
				</Combobox.Popup>
			</Combobox.Root>
		);

		await user.click( screen.getByRole( 'combobox' ) );
		await waitFor( () => {
			expect( screen.getByText( 'Item 2' ) ).toBeVisible();
		} );
		await user.click( screen.getByText( 'Item 2' ) );

		expect( onValueChange ).toHaveBeenCalledWith(
			ITEMS[ 1 ],
			expect.anything()
		);
	} );

	describe( 'portal', () => {
		it( 'should render inside the portal container when a custom target is provided', async () => {
			const user = userEvent.setup();
			const containerRef = createRef< HTMLDivElement >();

			render(
				<div data-testid="wrapper">
					<Combobox.Root items={ ITEMS }>
						<Combobox.Trigger />
						<div
							ref={ containerRef }
							data-testid="custom-container"
						/>
						<Combobox.Popup
							portal={
								<Combobox.Portal container={ containerRef } />
							}
						>
							<Combobox.List>
								<Combobox.ListBody>
									<Combobox.Collection>
										{ ( item ) => (
											<Combobox.Item
												key={ item.id }
												value={ item }
											>
												{ item.value }
											</Combobox.Item>
										) }
									</Combobox.Collection>
								</Combobox.ListBody>
							</Combobox.List>
						</Combobox.Popup>
					</Combobox.Root>
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
					<Combobox.Root items={ ITEMS }>
						<Combobox.Trigger />
						<Combobox.Popup>
							<Combobox.List>
								<Combobox.ListBody>
									<Combobox.Collection>
										{ ( item ) => (
											<Combobox.Item
												key={ item.id }
												value={ item }
											>
												{ item.value }
											</Combobox.Item>
										) }
									</Combobox.Collection>
								</Combobox.ListBody>
							</Combobox.List>
						</Combobox.Popup>
					</Combobox.Root>
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

	describe( 'when disabled', () => {
		it( 'hides the chip remove button from screen readers', () => {
			renderDisabledMultiSelect();

			expect(
				screen.queryByRole( 'button', { name: 'Remove' } )
			).not.toBeInTheDocument();
		} );

		it( 'hides the clear button from screen readers', () => {
			renderDisabledMultiSelect();

			expect(
				screen.queryByRole( 'button', { name: 'Clear' } )
			).not.toBeInTheDocument();
		} );

		it( 'does not show a tooltip when the chip remove button is hovered', async () => {
			const user = userEvent.setup( { pointerEventsCheck: 0 } );
			renderDisabledMultiSelect();

			const removeButton = screen.getByLabelText( 'Remove', {
				selector: 'button',
			} );
			await user.hover( removeButton );

			expect( screen.queryByRole( 'tooltip' ) ).not.toBeInTheDocument();
		} );

		it( 'does not show a tooltip when the clear button is hovered', async () => {
			const user = userEvent.setup( { pointerEventsCheck: 0 } );
			renderDisabledMultiSelect();

			const clearButton = screen.getByLabelText( 'Clear', {
				selector: 'button',
			} );
			await user.hover( clearButton );

			expect( screen.queryByRole( 'tooltip' ) ).not.toBeInTheDocument();
		} );
	} );
} );
