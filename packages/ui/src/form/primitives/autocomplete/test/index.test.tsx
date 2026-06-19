import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';
import type { ReactNode } from 'react';
import * as Autocomplete from '../index';
import { useEnableWpCompatOverlaySlot } from '../../../../utils/use-enable-wp-compat-overlay-slot';

const ITEMS = [
	{ id: '1', value: 'Item 1' },
	{ id: '2', value: 'Item 2' },
	{ id: '3', value: 'Item 3' },
];

function renderDisabledAutocompleteWithClear() {
	return render(
		<Autocomplete.Root items={ ITEMS } disabled defaultValue="Item 1">
			<Autocomplete.Input placeholder="Search" />
			<Autocomplete.Clear />
		</Autocomplete.Root>
	);
}

describe( 'Autocomplete', () => {
	it( 'forwards ref', async () => {
		const user = userEvent.setup();
		const inputGroupRef = createRef< HTMLDivElement >();
		const inputRef = createRef< HTMLInputElement >();
		const popupRef = createRef< HTMLDivElement >();
		const listRef = createRef< HTMLDivElement >();
		const listBodyRef = createRef< HTMLDivElement >();
		const itemRef = createRef< HTMLDivElement >();
		const clearRef = createRef< HTMLButtonElement >();
		const emptyRef = createRef< HTMLDivElement >();

		render(
			<Autocomplete.Root items={ ITEMS }>
				<Autocomplete.InputGroup ref={ inputGroupRef }>
					<Autocomplete.Input ref={ inputRef } placeholder="Search" />
				</Autocomplete.InputGroup>
				<Autocomplete.Popup ref={ popupRef }>
					<Autocomplete.Empty ref={ emptyRef }>
						No results found.
					</Autocomplete.Empty>
					<Autocomplete.List ref={ listRef }>
						<Autocomplete.ListBody ref={ listBodyRef }>
							<Autocomplete.Collection>
								{ ( item ) => (
									<Autocomplete.Item
										key={ item.id }
										ref={
											item.id === '1'
												? itemRef
												: undefined
										}
										value={ item }
									>
										{ item.value }
									</Autocomplete.Item>
								) }
							</Autocomplete.Collection>
						</Autocomplete.ListBody>
					</Autocomplete.List>
					<Autocomplete.Clear ref={ clearRef } />
				</Autocomplete.Popup>
			</Autocomplete.Root>
		);

		expect( inputGroupRef.current ).toBeInstanceOf( HTMLDivElement );
		expect( inputRef.current ).toBeInstanceOf( HTMLInputElement );

		await user.type( inputRef.current!, 'Item' );

		await waitFor( () => {
			expect( popupRef.current ).toBeInstanceOf( HTMLDivElement );
		} );
		expect( listRef.current ).toBeInstanceOf( HTMLDivElement );
		expect( listBodyRef.current ).toBeInstanceOf( HTMLDivElement );
		expect( itemRef.current ).toBeInstanceOf( HTMLDivElement );
		expect( clearRef.current ).toBeInstanceOf( HTMLButtonElement );
		expect( emptyRef.current ).toBeInstanceOf( HTMLDivElement );
	} );

	describe( 'portal', () => {
		it( 'should render inside the portal container when a custom target is provided', async () => {
			const user = userEvent.setup();
			const containerRef = createRef< HTMLDivElement >();

			render(
				<div data-testid="wrapper">
					<Autocomplete.Root items={ ITEMS }>
						<Autocomplete.Input placeholder="Search" />
						<div
							ref={ containerRef }
							data-testid="custom-container"
						/>
						<Autocomplete.Popup
							portal={
								<Autocomplete.Portal
									container={ containerRef }
								/>
							}
						>
							<Autocomplete.List>
								<Autocomplete.ListBody>
									<Autocomplete.Collection>
										{ ( item ) => (
											<Autocomplete.Item
												key={ item.id }
												value={ item }
											>
												{ item.value }
											</Autocomplete.Item>
										) }
									</Autocomplete.Collection>
								</Autocomplete.ListBody>
							</Autocomplete.List>
						</Autocomplete.Popup>
					</Autocomplete.Root>
				</div>
			);

			await user.type( screen.getByRole( 'combobox' ), 'Item 1' );

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
					<Autocomplete.Root items={ ITEMS }>
						<Autocomplete.Input placeholder="Search" />
						<Autocomplete.Popup>
							<Autocomplete.List>
								<Autocomplete.ListBody>
									<Autocomplete.Collection>
										{ ( item ) => (
											<Autocomplete.Item
												key={ item.id }
												value={ item }
											>
												{ item.value }
											</Autocomplete.Item>
										) }
									</Autocomplete.Collection>
								</Autocomplete.ListBody>
							</Autocomplete.List>
						</Autocomplete.Popup>
					</Autocomplete.Root>
				</div>
			);

			await user.type( screen.getByRole( 'combobox' ), 'Item 1' );

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
				<Autocomplete.Root items={ ITEMS }>
					<Autocomplete.Input placeholder="Search" />
					<Autocomplete.Popup
						positioner={
							<Autocomplete.Positioner data-testid="custom-positioner" />
						}
					>
						<Autocomplete.List>
							<Autocomplete.ListBody>
								<Autocomplete.Collection>
									{ ( item ) => (
										<Autocomplete.Item
											key={ item.id }
											value={ item }
										>
											{ item.value }
										</Autocomplete.Item>
									) }
								</Autocomplete.Collection>
							</Autocomplete.ListBody>
						</Autocomplete.List>
					</Autocomplete.Popup>
				</Autocomplete.Root>
			);

			await user.type( screen.getByRole( 'combobox' ), 'Item 1' );

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
					<Autocomplete.Root items={ ITEMS }>
						<Autocomplete.Input placeholder="Search" />
						<Autocomplete.Popup>
							<Autocomplete.List>
								<Autocomplete.ListBody>
									<Autocomplete.Collection>
										{ ( item ) => (
											<Autocomplete.Item
												key={ item.id }
												value={ item }
											>
												{ item.value }
											</Autocomplete.Item>
										) }
									</Autocomplete.Collection>
								</Autocomplete.ListBody>
							</Autocomplete.List>
						</Autocomplete.Popup>
					</Autocomplete.Root>
				</WithSlotEnabled>
			);

			await user.type( screen.getByRole( 'combobox' ), 'Item 1' );

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
				<Autocomplete.Root items={ ITEMS }>
					<Autocomplete.Input placeholder="Search" />
					<Autocomplete.Popup>
						<Autocomplete.List>
							<Autocomplete.ListBody>
								<Autocomplete.Collection>
									{ ( item ) => (
										<Autocomplete.Item
											key={ item.id }
											value={ item }
										>
											{ item.value }
										</Autocomplete.Item>
									) }
								</Autocomplete.Collection>
							</Autocomplete.ListBody>
						</Autocomplete.List>
					</Autocomplete.Popup>
				</Autocomplete.Root>
			);

			await user.type( screen.getByRole( 'combobox' ), 'Item 1' );

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
					<Autocomplete.Root items={ ITEMS }>
						<Autocomplete.Input placeholder="Search" />
						<div
							ref={ containerRef }
							data-testid="custom-container"
						/>
						<Autocomplete.Popup
							portal={
								<Autocomplete.Portal
									container={ containerRef }
								/>
							}
						>
							<Autocomplete.List>
								<Autocomplete.ListBody>
									<Autocomplete.Collection>
										{ ( item ) => (
											<Autocomplete.Item
												key={ item.id }
												value={ item }
											>
												{ item.value }
											</Autocomplete.Item>
										) }
									</Autocomplete.Collection>
								</Autocomplete.ListBody>
							</Autocomplete.List>
						</Autocomplete.Popup>
					</Autocomplete.Root>
				</WithSlotEnabled>
			);

			await user.type( screen.getByRole( 'combobox' ), 'Item 1' );

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
		it( 'hides the clear button from screen readers', () => {
			renderDisabledAutocompleteWithClear();

			expect(
				screen.queryByRole( 'button', { name: 'Clear' } )
			).not.toBeInTheDocument();
		} );

		it( 'does not show a tooltip when the clear button is hovered', async () => {
			const user = userEvent.setup( { pointerEventsCheck: 0 } );
			renderDisabledAutocompleteWithClear();

			const clearButton = screen.getByLabelText( 'Clear', {
				selector: 'button',
			} );
			await user.hover( clearButton );

			expect( screen.queryByRole( 'tooltip' ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'grouped items', () => {
		const GROUPED_ITEMS = [
			{
				label: 'Group 1',
				items: [
					{ id: '1', value: 'Item 1' },
					{ id: '2', value: 'Item 2' },
				],
			},
			{
				label: 'Group 2',
				items: [ { id: '3', value: 'Item 3' } ],
			},
		];

		it( 'forwards refs', async () => {
			const user = userEvent.setup();
			const groupRef = createRef< HTMLDivElement >();
			const groupLabelRef = createRef< HTMLDivElement >();

			render(
				<Autocomplete.Root items={ GROUPED_ITEMS }>
					<Autocomplete.Input placeholder="Search" />
					<Autocomplete.Popup>
						<Autocomplete.List>
							<Autocomplete.ListBody>
								<Autocomplete.Collection>
									{ ( group ) => (
										<Autocomplete.Group
											key={ group.label }
											ref={
												group.label === 'Group 1'
													? groupRef
													: undefined
											}
											items={ group.items }
										>
											<Autocomplete.GroupLabel
												ref={
													group.label === 'Group 1'
														? groupLabelRef
														: undefined
												}
											>
												{ group.label }
											</Autocomplete.GroupLabel>
											<Autocomplete.Collection>
												{ ( item ) => (
													<Autocomplete.Item
														key={ item.id }
														value={ item }
													>
														{ item.value }
													</Autocomplete.Item>
												) }
											</Autocomplete.Collection>
										</Autocomplete.Group>
									) }
								</Autocomplete.Collection>
							</Autocomplete.ListBody>
						</Autocomplete.List>
					</Autocomplete.Popup>
				</Autocomplete.Root>
			);

			await user.type( screen.getByRole( 'combobox' ), 'Item' );

			await waitFor( () => {
				expect( groupRef.current ).toBeInstanceOf( HTMLDivElement );
			} );
			expect( groupLabelRef.current ).toBeInstanceOf( HTMLDivElement );
		} );
	} );
} );
