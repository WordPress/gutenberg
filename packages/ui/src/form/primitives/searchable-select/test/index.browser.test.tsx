import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import warning from '@wordpress/warning';
import type { Item, ItemGroup } from '../types';
import { SearchableSelect } from '../index';

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

vi.mock( import( '@wordpress/warning' ), async ( importOriginal ) => {
	const original = await importOriginal();

	return {
		...original,
		default: vi.fn(),
	} as unknown as typeof original;
} );

const mockedWarning = vi.mocked( warning );

describe( 'SearchableSelect', () => {
	beforeEach( () => {
		mockedWarning.mockClear();
	} );

	it( 'passes aria-label and aria-describedby props to the appropriate components', async () => {
		const user = userEvent;

		await render(
			<>
				<SearchableSelect
					aria-label="My label"
					aria-describedby="searchable-select-description"
					items={ ITEMS }
				/>
				<p id="searchable-select-description">My description</p>
			</>
		);

		const trigger = screen.getByRole( 'combobox', {
			name: 'My label',
			description: 'My description',
		} );
		await expect.element( trigger ).toBeVisible();

		await user.click( trigger );

		await expect
			.element(
				await screen.findByRole( 'dialog', { name: 'My label' } )
			)
			.toBeVisible();
	} );

	it( 'passes aria-labelledby prop to the appropriate component', async () => {
		const user = userEvent;

		await render(
			<>
				<p id="searchable-select-label">My label</p>
				<SearchableSelect
					aria-labelledby="searchable-select-label"
					items={ ITEMS }
				/>
			</>
		);

		const trigger = screen.getByRole( 'combobox', {
			name: 'My label',
		} );
		await expect.element( trigger ).toBeVisible();

		await user.click( trigger );

		await expect
			.element(
				await screen.findByRole( 'dialog', { name: 'My label' } )
			)
			.toBeVisible();
	} );

	it( 'names the search input from searchPlaceholder', async () => {
		const user = userEvent;

		await render(
			<SearchableSelect
				aria-label="Fruit"
				items={ ITEMS }
				searchPlaceholder="Find fruit"
			/>
		);

		await user.click( screen.getByRole( 'combobox', { name: 'Fruit' } ) );

		const input = await screen.findByPlaceholderText( 'Find fruit' );
		await expect.element( input ).toBeVisible();
		expect( input ).toHaveAccessibleName( 'Find fruit' );
	} );

	it( 'renders a default trigger placeholder when no value is selected', async () => {
		await render( <SearchableSelect items={ ITEMS } /> );

		const trigger = screen.getByRole( 'combobox' );
		await expect.element( trigger ).toBeVisible();
		expect( trigger ).toHaveTextContent( 'Select' );
	} );

	it( 'renders custom placeholder text when no value is selected', async () => {
		await render(
			<SearchableSelect
				aria-label="Fruit"
				items={ ITEMS }
				placeholder="Choose a fruit"
			/>
		);

		const trigger = screen.getByRole( 'combobox', { name: 'Fruit' } );
		await expect.element( trigger ).toBeVisible();
		expect( trigger ).toHaveTextContent( 'Choose a fruit' );
	} );

	it( 'renders flat items with the default renderer', async () => {
		const user = userEvent;
		await render( <SearchableSelect items={ ITEMS } /> );

		await user.click( screen.getByRole( 'combobox' ) );

		await waitFor( () => {
			expect(
				screen.getByRole( 'option', { name: 'Apple' } )
			).toBeVisible();
		} );
		await expect
			.element( screen.getByRole( 'option', { name: 'Apricot' } ) )
			.toBeVisible();
		await expect
			.element( screen.getByRole( 'option', { name: 'Banana' } ) )
			.toBeVisible();
	} );

	it( 'renders grouped items in the popup', async () => {
		const user = userEvent;

		await render(
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
		await expect.element( screen.getByText( 'Berries' ) ).toBeVisible();
		await expect.element( screen.getByText( 'Apple' ) ).toBeVisible();
		await expect.element( screen.getByText( 'Strawberry' ) ).toBeVisible();
	} );

	it( 'selects a grouped item', async () => {
		const user = userEvent;
		const onValueChange = vi.fn();

		await render(
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
		await expect.element( trigger ).toBeVisible();
		expect( trigger ).toHaveTextContent( 'Strawberry' );
	} );

	it( 'announces statusContent in a status live region', async () => {
		const user = userEvent;

		await render(
			<SearchableSelect
				aria-label="Fruit"
				items={ ITEMS }
				statusContent="Loading…"
			/>
		);

		await user.click( screen.getByRole( 'combobox', { name: 'Fruit' } ) );

		const status = await screen.findByText( 'Loading…' );
		await expect.element( status ).toBeVisible();
		expect( status ).toHaveAttribute( 'role', 'status' );
	} );

	it( 'keeps the status live region mounted when statusContent is cleared', async () => {
		const user = userEvent;
		const { rerender } = await render(
			<SearchableSelect
				aria-label="Fruit"
				items={ ITEMS }
				statusContent="Loading…"
			/>
		);

		await user.click( screen.getByRole( 'combobox', { name: 'Fruit' } ) );

		const status = await screen.findByText( 'Loading…' );

		rerender(
			<SearchableSelect
				aria-label="Fruit"
				items={ ITEMS }
				statusContent={ null }
			/>
		);

		await expect.element( status ).toBeVisible();
		expect( status ).toHaveAttribute( 'role', 'status' );
		expect( status ).toBeEmptyDOMElement();
	} );

	describe( 'creatable item', () => {
		const creatableItem = {
			value: '__create__',
			label: 'Create new item',
			creatable: true,
		};

		it( 'renders the creatable item in the list footer using the default renderer', async () => {
			const user = userEvent;

			await render(
				<SearchableSelect items={ [ ...ITEMS, creatableItem ] } />
			);

			await user.click( screen.getByRole( 'combobox' ) );

			await waitFor( () => {
				expect( screen.getByText( 'Create new item' ) ).toBeVisible();
			} );
			await expect.element( screen.getByText( 'Apple' ) ).toBeVisible();
			expect(
				screen.getAllByRole( 'option', { name: 'Create new item' } )
			).toHaveLength( 1 );
		} );

		it( 'renders only one creatable option when custom children are used', async () => {
			const user = userEvent;

			await render(
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

		it( 'renders only one creatable option when it is in its own group', async () => {
			const user = userEvent;
			const groupedCreatableItem = {
				value: '__create__',
				label: 'Create new item',
				creatable: true,
			};
			const items = [
				{
					label: 'Common',
					items: [ GROUPED_ITEMS[ 0 ].items[ 0 ] ],
				},
				{ label: '', items: [ groupedCreatableItem ] },
			];

			await render(
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
			await expect.element( screen.getByText( 'Apple' ) ).toBeVisible();
			expect(
				screen.getAllByRole( 'option', { name: 'Create new item' } )
			).toHaveLength( 1 );
		} );

		it( 'selects the creatable item by keyboard when grouped children are used', async () => {
			const user = userEvent;
			const onValueChange = vi.fn();
			const groupedCreatableItem = {
				value: '__create__',
				label: 'Create new item',
				creatable: true,
			};
			const items = [
				{
					label: 'Common',
					items: [ { value: 'apple', label: 'Apple' } ],
				},
				{ label: '', items: [ groupedCreatableItem ] },
			];

			await render(
				<SearchableSelect
					items={ items }
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
					screen.getByRole( 'option', { name: 'Create new item' } )
				).toBeVisible();
			} );

			await user.click( screen.getByPlaceholderText( 'Search' ) );
			await user.keyboard( '{ArrowDown}{ArrowDown}{Enter}' );

			expect( onValueChange ).toHaveBeenCalledWith(
				expect.objectContaining( { value: '__create__' } ),
				expect.anything()
			);
		} );

		it( 'selects the creatable footer by keyboard when it is not last in a flat list', async () => {
			const user = userEvent;
			const onValueChange = vi.fn();

			await render(
				<SearchableSelect
					items={ [ ITEMS[ 0 ], creatableItem, ITEMS[ 2 ] ] }
					onValueChange={ onValueChange }
				/>
			);

			await user.click( screen.getByRole( 'combobox' ) );

			await waitFor( () => {
				expect(
					screen.getByRole( 'option', { name: 'Create new item' } )
				).toBeVisible();
			} );

			await user.click( screen.getByPlaceholderText( 'Search' ) );
			await user.keyboard( '{ArrowDown}{ArrowDown}{ArrowDown}{Enter}' );

			expect( onValueChange ).toHaveBeenCalledWith(
				expect.objectContaining( { value: '__create__' } ),
				expect.anything()
			);
		} );

		it( 'hides the creatable footer when the query matches no items', async () => {
			const user = userEvent;

			await render(
				<SearchableSelect
					items={ [ ...ITEMS, creatableItem ] }
					inputValue="xyzzy"
				/>
			);

			await user.click( screen.getByRole( 'combobox' ) );

			await waitFor( () => {
				expect( screen.getByText( 'No results found.' ) ).toBeVisible();
			} );
			expect(
				screen.queryByRole( 'option', { name: 'Create new item' } )
			).not.toBeInTheDocument();
		} );

		it( 'hides the creatable footer when the query matches other items but not the creatable item', async () => {
			const user = userEvent;

			await render(
				<SearchableSelect
					items={ [ ...ITEMS, creatableItem ] }
					inputValue="Apple"
				/>
			);

			await user.click( screen.getByRole( 'combobox' ) );

			await waitFor( () => {
				expect(
					screen.getByRole( 'option', { name: 'Apple' } )
				).toBeVisible();
			} );
			expect(
				screen.queryByRole( 'option', { name: 'Create new item' } )
			).not.toBeInTheDocument();
		} );

		it( 'keeps the creatable footer when the query matches the creatable item', async () => {
			const user = userEvent;

			await render(
				<SearchableSelect
					items={ [ ...ITEMS, creatableItem ] }
					inputValue="Create"
				/>
			);

			await user.click( screen.getByRole( 'combobox' ) );

			await waitFor( () => {
				expect(
					screen.getByRole( 'option', { name: 'Create new item' } )
				).toBeVisible();
			} );
			expect(
				screen.getAllByRole( 'option', { name: 'Create new item' } )
			).toHaveLength( 1 );
			expect(
				screen.queryByRole( 'option', { name: 'Apple' } )
			).not.toBeInTheDocument();
		} );

		it( 'keeps the creatable footer when the query matches a grouped creatable item', async () => {
			const user = userEvent;
			const groupedCreatableItem = {
				value: '__create__',
				label: 'Create new item',
				creatable: true,
			};
			const items = [
				{
					label: 'Common',
					items: [ { value: 'apple', label: 'Apple' } ],
				},
				{ label: '', items: [ groupedCreatableItem ] },
			];

			await render(
				<SearchableSelect
					items={ items }
					inputValue="Create"
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
					screen.getByRole( 'option', { name: 'Create new item' } )
				).toBeVisible();
			} );
			expect(
				screen.getAllByRole( 'option', { name: 'Create new item' } )
			).toHaveLength( 1 );
			expect(
				screen.queryByRole( 'option', { name: 'Apple' } )
			).not.toBeInTheDocument();
		} );
	} );
} );
