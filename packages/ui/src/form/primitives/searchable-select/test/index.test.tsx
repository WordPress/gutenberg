import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';
import warning from '@wordpress/warning';
import { SearchableSelect } from '../index';
import type { Item, ItemGroup } from '../types';

const ITEMS: Item[] = [
	{ value: 'apple', label: 'Apple' },
	{ value: 'apricot', label: 'Apricot' },
	{ value: 'banana', label: 'Banana' },
];

const GROUPED_ITEMS: ItemGroup[] = [
	{
		label: 'Common',
		items: [
			{ value: 'apple', label: 'Apple' },
			{ value: 'banana', label: 'Banana' },
			{ value: 'orange', label: 'Orange' },
		],
	},
	{
		label: 'Berries',
		items: [
			{ value: 'strawberry', label: 'Strawberry' },
			{ value: 'blueberry', label: 'Blueberry' },
			{ value: 'raspberry', label: 'Raspberry' },
		],
	},
];

jest.mock( '@wordpress/warning', () => jest.fn() );

const mockedWarning = warning as jest.MockedFunction< typeof warning >;

describe( 'SearchableSelect', () => {
	beforeEach( () => {
		mockedWarning.mockClear();
	} );

	it( 'forwards ref', () => {
		const ref = createRef< HTMLButtonElement >();

		render( <SearchableSelect ref={ ref } /> );

		expect( ref.current ).toBeInstanceOf( HTMLButtonElement );
	} );

	it( 'passes aria-label and aria-describedby props to the appropriate components', () => {
		render(
			<>
				<SearchableSelect
					aria-label="My label"
					aria-describedby="searchable-select-description"
				/>
				{ /* eslint-disable-next-line no-restricted-syntax -- stable test ids */ }
				<p id="searchable-select-description">My description</p>
			</>
		);

		expect(
			screen.getByRole( 'combobox', {
				name: 'My label',
				description: 'My description',
			} )
		).toBeVisible();
	} );

	it( 'passes aria-labelledby prop to the appropriate component', () => {
		render(
			<>
				{ /* eslint-disable-next-line no-restricted-syntax -- stable test ids */ }
				<p id="searchable-select-label">My label</p>
				<SearchableSelect aria-labelledby="searchable-select-label" />
			</>
		);

		expect(
			screen.getByRole( 'combobox', {
				name: 'My label',
			} )
		).toBeVisible();
	} );

	it( 'renders flat items with the default renderer', async () => {
		const user = userEvent.setup();
		render( <SearchableSelect items={ ITEMS } /> );

		await user.click( screen.getByRole( 'combobox' ) );

		await waitFor( () => {
			expect(
				screen.getByRole( 'option', { name: 'Apple' } )
			).toBeVisible();
		} );
		expect(
			screen.getByRole( 'option', { name: 'Apricot' } )
		).toBeVisible();
		expect(
			screen.getByRole( 'option', { name: 'Banana' } )
		).toBeVisible();
	} );

	it( 'renders grouped items in the popup', async () => {
		const user = userEvent.setup();

		render(
			<SearchableSelect
				items={ GROUPED_ITEMS }
				children={ ( group: ItemGroup ) => (
					<SearchableSelect.Group
						key={ group.label }
						items={ group.items }
					>
						<SearchableSelect.GroupLabel>
							{ group.label }
						</SearchableSelect.GroupLabel>
						<SearchableSelect.Collection>
							{ ( item: Item ) => (
								<SearchableSelect.Item
									key={ item.value }
									value={ item }
								>
									{ item.label }
								</SearchableSelect.Item>
							) }
						</SearchableSelect.Collection>
					</SearchableSelect.Group>
				) }
			/>
		);

		await user.click( screen.getByRole( 'combobox' ) );

		await waitFor( () => {
			expect( screen.getByText( 'Common' ) ).toBeVisible();
		} );
		expect( screen.getByText( 'Berries' ) ).toBeVisible();
		expect( screen.getByText( 'Apple' ) ).toBeVisible();
		expect( screen.getByText( 'Strawberry' ) ).toBeVisible();
	} );

	it( 'selects a grouped item', async () => {
		const user = userEvent.setup();
		const onValueChange = jest.fn();

		render(
			<SearchableSelect
				aria-label="Fruit"
				items={ GROUPED_ITEMS }
				onValueChange={ onValueChange }
				children={ ( group: ItemGroup ) => (
					<SearchableSelect.Group
						key={ group.label }
						items={ group.items }
					>
						<SearchableSelect.GroupLabel>
							{ group.label }
						</SearchableSelect.GroupLabel>
						<SearchableSelect.Collection>
							{ ( item: Item ) => (
								<SearchableSelect.Item
									key={ item.value }
									value={ item }
								>
									{ item.label }
								</SearchableSelect.Item>
							) }
						</SearchableSelect.Collection>
					</SearchableSelect.Group>
				) }
			/>
		);

		await user.click( screen.getByRole( 'combobox' ) );

		await user.click(
			await screen.findByRole( 'option', { name: 'Strawberry' } )
		);

		expect( onValueChange ).toHaveBeenCalledWith(
			expect.objectContaining( {
				value: 'strawberry',
				label: 'Strawberry',
			} ),
			expect.anything()
		);
		const trigger = screen.getByRole( 'combobox', { name: 'Fruit' } );
		expect( trigger ).toBeVisible();
		expect( trigger ).toHaveTextContent( 'Strawberry' );
	} );

	describe( 'creatable item', () => {
		const creatableItem = {
			value: '__create__',
			label: 'Create new item',
			creatable: true,
		};

		it( 'renders the creatable item in the list footer using the default renderer', async () => {
			const user = userEvent.setup();

			render(
				<SearchableSelect items={ [ ...ITEMS, creatableItem ] } />
			);

			await user.click( screen.getByRole( 'combobox' ) );

			await waitFor( () => {
				expect( screen.getByText( 'Create new item' ) ).toBeVisible();
			} );
			expect( screen.getByText( 'Apple' ) ).toBeVisible();
			expect(
				screen.getAllByRole( 'option', { name: 'Create new item' } )
			).toHaveLength( 1 );
		} );

		it( 'renders only one creatable option when custom children are used', async () => {
			const user = userEvent.setup();

			render(
				<SearchableSelect
					items={ [ ...ITEMS, creatableItem ] }
					children={ ( item: ( typeof ITEMS )[ 0 ] ) => (
						<SearchableSelect.Item
							key={ item.value }
							value={ item }
						>
							{ item.label }
						</SearchableSelect.Item>
					) }
				/>
			);

			await user.click( screen.getByRole( 'combobox' ) );

			await waitFor( () => {
				expect( screen.getByText( 'Create new item' ) ).toBeVisible();
			} );
			expect(
				screen.getAllByRole( 'option', { name: 'Create new item' } )
			).toHaveLength( 1 );
		} );

		it( 'renders only one creatable option when it is mixed with regular items in a group', async () => {
			const user = userEvent.setup();
			const groupedCreatableItem = {
				value: '__create__',
				label: 'Create new item',
				creatable: true,
			};
			const items = [
				{
					label: 'Common',
					items: [
						GROUPED_ITEMS[ 0 ].items[ 0 ],
						groupedCreatableItem,
					],
				},
			];

			render(
				<SearchableSelect
					items={ items }
					children={ ( group: ItemGroup ) => (
						<SearchableSelect.Group
							key={ group.label }
							items={ group.items }
						>
							<SearchableSelect.GroupLabel>
								{ group.label }
							</SearchableSelect.GroupLabel>
							<SearchableSelect.Collection>
								{ ( item: Item ) => (
									<SearchableSelect.Item
										key={ item.value }
										value={ item }
									>
										{ item.label }
									</SearchableSelect.Item>
								) }
							</SearchableSelect.Collection>
						</SearchableSelect.Group>
					) }
				/>
			);

			await user.click( screen.getByRole( 'combobox' ) );

			await waitFor( () => {
				expect( screen.getByText( 'Create new item' ) ).toBeVisible();
			} );
			expect( screen.getByText( 'Apple' ) ).toBeVisible();
			expect(
				screen.getAllByRole( 'option', { name: 'Create new item' } )
			).toHaveLength( 1 );
		} );

		it( 'selects the creatable item by keyboard when grouped children are used', async () => {
			const user = userEvent.setup();
			const onValueChange = jest.fn();
			const groupedCreatableItem = {
				value: '__create__',
				label: 'Create new item: zzzzz',
				creatable: true,
			};
			const items = [
				...GROUPED_ITEMS,
				{ label: '', items: [ groupedCreatableItem ] },
			];

			render(
				<SearchableSelect
					items={ items }
					inputValue="zzzzz"
					onValueChange={ onValueChange }
					children={ ( group: ItemGroup ) => (
						<SearchableSelect.Group
							key={ group.label }
							items={ group.items }
						>
							<SearchableSelect.GroupLabel>
								{ group.label }
							</SearchableSelect.GroupLabel>
							<SearchableSelect.Collection>
								{ ( item: Item ) => (
									<SearchableSelect.Item
										key={ item.value }
										value={ item }
									>
										{ item.label }
									</SearchableSelect.Item>
								) }
							</SearchableSelect.Collection>
						</SearchableSelect.Group>
					) }
				/>
			);

			await user.click( screen.getByRole( 'combobox' ) );

			await waitFor( () => {
				expect(
					screen.getByRole( 'option', {
						name: 'Create new item: zzzzz',
					} )
				).toBeVisible();
			} );

			await user.click( screen.getByPlaceholderText( 'Search' ) );
			await user.keyboard( '{ArrowDown}{Enter}' );

			expect( onValueChange ).toHaveBeenCalledWith(
				expect.objectContaining( { value: '__create__' } ),
				expect.anything()
			);
		} );
	} );

	it( 'warns when grouped items are used without children', () => {
		render( <SearchableSelect items={ GROUPED_ITEMS } /> );

		expect( mockedWarning ).toHaveBeenCalledWith(
			'SearchableSelect: grouped `items` require a `children` renderer. See the `Grouped` story for an example.'
		);
	} );

	it( 'warns when multiple creatable items are provided', () => {
		render(
			<SearchableSelect
				items={ [
					{
						value: '__create-a__',
						label: 'Create A',
						creatable: true,
					},
					{
						value: '__create-b__',
						label: 'Create B',
						creatable: true,
					},
				] }
			/>
		);

		expect( mockedWarning ).toHaveBeenCalledWith(
			'SearchableSelect: expected at most one item with `creatable: true` in `items`.'
		);
	} );
} );
