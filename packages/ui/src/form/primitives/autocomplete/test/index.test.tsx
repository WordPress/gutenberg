import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';
import * as Autocomplete from '../index';

const ITEMS = [
	{ id: '1', value: 'Item 1' },
	{ id: '2', value: 'Item 2' },
	{ id: '3', value: 'Item 3' },
];

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
} );
