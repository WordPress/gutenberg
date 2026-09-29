import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { createRef } from '@wordpress/element';
import * as Combobox from '../index';
import * as Tooltip from '../../../../tooltip';
import { useEnableWpCompatOverlaySlot } from '../../../../utils/use-enable-wp-compat-overlay-slot';

const ITEMS = [
	{ id: '1', value: 'Item 1' },
	{ id: '2', value: 'Item 2' },
	{ id: '3', value: 'Item 3' },
];

type Item = ( typeof ITEMS )[ number ];

function renderDisabledMultiSelect( disabled: boolean ) {
	return render(
		<Tooltip.Provider delay={ 0 }>
			<Combobox.Root< Item, true >
				items={ ITEMS }
				multiple
				disabled={ disabled }
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
		</Tooltip.Provider>
	);
}

describe( 'Combobox', () => {
	it( 'forwards ref', async () => {
		const user = userEvent;
		const triggerRef = createRef< HTMLButtonElement >();
		const popupRef = createRef< HTMLDivElement >();
		const positionerRef = createRef< HTMLDivElement >();
		const inputGroupRef = createRef< HTMLDivElement >();
		const inputRef = createRef< HTMLInputElement >();
		const listRef = createRef< HTMLDivElement >();
		const listBodyRef = createRef< HTMLDivElement >();
		const listFooterRef = createRef< HTMLDivElement >();
		const itemRef = createRef< HTMLDivElement >();
		const chipsRef = createRef< HTMLDivElement >();
		const chipWithRemoveRef = createRef< HTMLDivElement >();
		const clearRef = createRef< HTMLButtonElement >();
		const emptyRef = createRef< HTMLDivElement >();
		const statusRef = createRef< HTMLDivElement >();

		await render(
			<Combobox.Root items={ ITEMS } defaultValue={ ITEMS[ 0 ] }>
				<Combobox.Trigger ref={ triggerRef } />
				<Combobox.Popup
					ref={ popupRef }
					positioner={ <Combobox.Positioner ref={ positionerRef } /> }
				>
					<Combobox.InputGroup ref={ inputGroupRef }>
						<Combobox.Input ref={ inputRef } placeholder="Search" />
					</Combobox.InputGroup>
					<Combobox.Value>
						<Combobox.Chips ref={ chipsRef }>
							<Combobox.ChipWithRemove
								ref={ chipWithRemoveRef }
							></Combobox.ChipWithRemove>
							<Combobox.Clear ref={ clearRef } />
						</Combobox.Chips>
					</Combobox.Value>
					<Combobox.Status ref={ statusRef }>
						Loading...
					</Combobox.Status>
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
		expect( inputGroupRef.current ).toBeInstanceOf( HTMLDivElement );
		expect( inputRef.current ).toBeInstanceOf( HTMLInputElement );
		expect( listRef.current ).toBeInstanceOf( HTMLDivElement );
		expect( listBodyRef.current ).toBeInstanceOf( HTMLDivElement );
		expect( listFooterRef.current ).toBeInstanceOf( HTMLDivElement );
		expect( itemRef.current ).toBeInstanceOf( HTMLDivElement );
		expect( chipsRef.current ).toBeInstanceOf( HTMLDivElement );
		expect( chipWithRemoveRef.current ).toBeInstanceOf( HTMLDivElement );
		expect( clearRef.current ).toBeInstanceOf( HTMLButtonElement );
		expect( emptyRef.current ).toBeInstanceOf( HTMLDivElement );
		expect( statusRef.current ).toBeInstanceOf( HTMLDivElement );
	} );

	it( 'uses a custom positioner', async () => {
		const user = userEvent;

		await render(
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

	it( 'uses a custom tooltip label for chip remove buttons', async () => {
		const user = userEvent;

		await render(
			<Tooltip.Provider delay={ 0 }>
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
											removeLabel="Delete"
										>
											{ item.value }
										</Combobox.ChipWithRemove>
									) ) }
								</>
							) }
						</Combobox.Value>
					</Combobox.Chips>
				</Combobox.Root>
			</Tooltip.Provider>
		);

		await user.hover(
			screen.getByLabelText( 'Delete', {
				selector: 'button',
			} )
		);

		await expect.element( screen.getByText( 'Delete' ) ).toBeVisible();
	} );

	it( 'allows selecting items when Empty is rendered after List', async () => {
		const user = userEvent;
		const onValueChange = vi.fn();

		await render(
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
			const user = userEvent;
			const containerRef = createRef< HTMLDivElement >();

			await render(
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
			await expect.element( item ).toBeVisible();

			expect( screen.getByTestId( 'custom-container' ) ).toContainElement(
				item
			);
		} );

		it( 'should render with a portal by default', async () => {
			const user = userEvent;

			await render(
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
			await expect.element( item ).toBeVisible();

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
			const user = userEvent;

			await render(
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
			await expect.element( item ).toBeVisible();

			const slot = document.querySelector( SLOT_SELECTOR );
			expect( slot ).not.toBeNull();
			expect( slot ).toContainElement( item );
		} );

		it( 'does not create a slot when the consumer has not opted in (dormant default)', async () => {
			const user = userEvent;

			await render(
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
			await expect.element( item ).toBeVisible();

			expect( document.querySelector( SLOT_SELECTOR ) ).toBeNull();
		} );

		it( 'lets a caller-supplied portal container override the slot', async () => {
			const user = userEvent;
			const containerRef = createRef< HTMLDivElement >();

			await render(
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
			const user = userEvent;
			const groupRef = createRef< HTMLDivElement >();
			const groupLabelRef = createRef< HTMLDivElement >();

			await render(
				<Combobox.Root items={ GROUPED_ITEMS }>
					<Combobox.Trigger />
					<Combobox.Popup>
						<Combobox.Input placeholder="Search" />
						<Combobox.List>
							<Combobox.ListBody>
								<Combobox.Collection>
									{ ( group ) => (
										<Combobox.Group
											key={ group.label }
											ref={
												group.label === 'Group 1'
													? groupRef
													: undefined
											}
											items={ group.items }
										>
											<Combobox.GroupLabel
												ref={
													group.label === 'Group 1'
														? groupLabelRef
														: undefined
												}
											>
												{ group.label }
											</Combobox.GroupLabel>
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
										</Combobox.Group>
									) }
								</Combobox.Collection>
							</Combobox.ListBody>
						</Combobox.List>
					</Combobox.Popup>
				</Combobox.Root>
			);

			await user.click( screen.getByRole( 'combobox' ) );

			await waitFor( () => {
				expect( groupRef.current ).toBeInstanceOf( HTMLDivElement );
			} );
			expect( groupLabelRef.current ).toBeInstanceOf( HTMLDivElement );
		} );
	} );

	describe( 'when disabled', () => {
		it.each( [ true, false ] )(
			'shows the chip remove tooltip only when enabled (disabled=%s)',
			async ( disabled ) => {
				const user = userEvent;
				await renderDisabledMultiSelect( disabled );

				const removeButton = screen.getByLabelText( 'Remove', {
					selector: 'button',
				} );
				await user.hover( removeButton );

				if ( disabled ) {
					expect(
						screen.queryByText( 'Remove' )
					).not.toBeInTheDocument();
				} else {
					await expect
						.element( screen.getByText( 'Remove' ) )
						.toBeVisible();
				}
			}
		);

		it.each( [ true, false ] )(
			'shows the clear tooltip only when enabled (disabled=%s)',
			async ( disabled ) => {
				const user = userEvent;
				await renderDisabledMultiSelect( disabled );

				const clearButton = screen.getByLabelText( 'Clear', {
					selector: 'button',
				} );
				await user.hover( clearButton );

				if ( disabled ) {
					expect(
						screen.queryByText( 'Clear' )
					).not.toBeInTheDocument();
				} else {
					await expect
						.element( screen.getByText( 'Clear' ) )
						.toBeVisible();
				}
			}
		);
	} );
} );
