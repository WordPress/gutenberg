import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';
import type { ReactNode } from 'react';
import * as Combobox from '../index';
import { useEnableWpCompatOverlaySlot } from '../../../../utils/use-enable-wp-compat-overlay-slot';

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
		const positionerRef = createRef< HTMLDivElement >();
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
				<Combobox.Popup
					ref={ popupRef }
					positioner={ <Combobox.Positioner ref={ positionerRef } /> }
				>
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
		expect( positionerRef.current ).toBeInstanceOf( HTMLDivElement );
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

	it( 'uses a custom positioner', async () => {
		const user = userEvent.setup();

		render(
			<Combobox.Root items={ ITEMS }>
				<Combobox.Trigger />
				<Combobox.Popup
					positioner={
						<Combobox.Positioner data-testid="custom-positioner" />
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
		);

		await user.click( screen.getByRole( 'combobox' ) );

		const item = await screen.findByRole( 'option', {
			name: 'Item 1',
		} );
		expect( screen.getByTestId( 'custom-positioner' ) ).toContainElement(
			item
		);
	} );

	it( 'uses a custom accessible label for chip remove buttons', () => {
		render(
			<Combobox.Root< Item, true >
				items={ ITEMS }
				multiple
				defaultValue={ [ ITEMS[ 0 ] ] }
			>
				<Combobox.Chips>
					<Combobox.Value>
						{ ( value: Item[] ) => (
							<>
								{ value.map( ( item ) => (
									<Combobox.ChipWithRemove
										key={ item.id }
										removeLabel={ `Remove ${ item.value }` }
									>
										{ item.value }
									</Combobox.ChipWithRemove>
								) ) }
							</>
						) }
					</Combobox.Value>
				</Combobox.Chips>
			</Combobox.Root>
		);

		expect(
			screen.getByRole( 'button', { name: 'Remove Item 1' } )
		).toBeVisible();
	} );

	it( 'renders a default trigger placeholder when no value is selected', () => {
		render(
			<Combobox.Root items={ ITEMS }>
				<Combobox.Trigger />
			</Combobox.Root>
		);

		const trigger = screen.getByRole( 'combobox' );

		expect( trigger ).toHaveTextContent( 'Select' );
	} );

	it( 'supports custom trigger placeholder text', () => {
		render(
			<Combobox.Root items={ ITEMS }>
				<Combobox.Trigger placeholder="Choose an item" />
			</Combobox.Root>
		);

		const trigger = screen.getByRole( 'combobox' );

		expect( trigger ).toHaveTextContent( 'Choose an item' );
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
