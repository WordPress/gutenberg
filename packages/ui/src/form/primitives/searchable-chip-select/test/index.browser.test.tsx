import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { createRef } from '@wordpress/element';
import warning from '@wordpress/warning';
import type { Item, ItemGroup } from '../types';
import { SearchableChipSelect } from '../index';
import { GROUPED_ITEMS, ITEMS } from './__fixtures__';

vi.mock( import( '@wordpress/warning' ), () => ( { default: vi.fn() } ) );

const mockedWarning = vi.mocked( warning );

describe( 'SearchableChipSelect', () => {
	beforeEach( () => {
		mockedWarning.mockClear();
	} );

	it( 'forwards ref to the search input', async () => {
		const ref = createRef< HTMLInputElement >();

		await render(
			<SearchableChipSelect ref={ ref } aria-label="Select options" />
		);

		const input = screen.getByRole( 'combobox', {
			name: 'Select options',
		} );

		expect( ref.current ).toBe( input );
		act( () => {
			ref.current?.focus();
		} );
		expect( input ).toHaveFocus();
	} );

	it( 'passes aria-label and aria-describedby props to the appropriate components', async () => {
		await render(
			<>
				<SearchableChipSelect
					aria-label="My label"
					aria-describedby="searchable-chip-select-description"
				/>
				<p id="searchable-chip-select-description">My description</p>
			</>
		);

		await expect
			.element(
				screen.getByRole( 'combobox', {
					name: 'My label',
					description: 'My description',
				} )
			)
			.toBeVisible();
	} );

	it( 'passes aria-labelledby prop to the appropriate component', async () => {
		await render(
			<>
				<p id="searchable-chip-select-label">My label</p>
				<SearchableChipSelect aria-labelledby="searchable-chip-select-label" />
			</>
		);

		await expect
			.element(
				screen.getByRole( 'combobox', {
					name: 'My label',
				} )
			)
			.toBeVisible();
	} );

	it( 'renders flat items with the default renderer', async () => {
		const user = userEvent;
		const items = ITEMS.slice( 0, 3 );

		await render( <SearchableChipSelect items={ items } /> );

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
			<SearchableChipSelect
				items={ GROUPED_ITEMS }
				children={ ( group: ItemGroup ) => (
					<SearchableChipSelect.Group
						key={ group.label }
						items={ group.items }
					>
						<SearchableChipSelect.GroupLabel>
							{ group.label }
						</SearchableChipSelect.GroupLabel>
						<SearchableChipSelect.Collection>
							{ ( item: Item ) => (
								<SearchableChipSelect.Item
									key={ item.value }
									value={ item }
								>
									{ item.label }
								</SearchableChipSelect.Item>
							) }
						</SearchableChipSelect.Collection>
					</SearchableChipSelect.Group>
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
			<SearchableChipSelect
				items={ GROUPED_ITEMS }
				onValueChange={ onValueChange }
				children={ ( group: ItemGroup ) => (
					<SearchableChipSelect.Group
						key={ group.label }
						items={ group.items }
					>
						<SearchableChipSelect.GroupLabel>
							{ group.label }
						</SearchableChipSelect.GroupLabel>
						<SearchableChipSelect.Collection>
							{ ( item: Item ) => (
								<SearchableChipSelect.Item
									key={ item.value }
									value={ item }
								>
									{ item.label }
								</SearchableChipSelect.Item>
							) }
						</SearchableChipSelect.Collection>
					</SearchableChipSelect.Group>
				) }
			/>
		);

		await user.click( screen.getByRole( 'combobox' ) );

		await user.click(
			await screen.findByRole( 'option', { name: 'Strawberry' } )
		);

		expect( onValueChange ).toHaveBeenCalledWith(
			expect.arrayContaining( [
				expect.objectContaining( {
					value: 'strawberry',
					label: 'Strawberry',
				} ),
			] ),
			expect.anything()
		);
		await expect
			.element( screen.getByRole( 'toolbar', { name: 'Selected item' } ) )
			.toBeVisible();
	} );

	it( 'keeps the search input focused after selecting the first item', async () => {
		const user = userEvent;

		await render(
			<SearchableChipSelect
				aria-label="Fruit"
				items={ ITEMS.slice( 0, 3 ) }
			/>
		);

		const input = screen.getByRole( 'combobox', { name: 'Fruit' } );
		await user.click( input );
		await user.click(
			await screen.findByRole( 'option', { name: 'Apple' } )
		);

		await expect
			.element( screen.getByRole( 'toolbar', { name: 'Selected item' } ) )
			.toBeVisible();
		expect( screen.getByRole( 'combobox', { name: 'Fruit' } ) ).toBe(
			input
		);
		await expect.element( input ).toHaveFocus();
	} );

	it( 'announces statusContent in a status live region', async () => {
		const user = userEvent;

		await render(
			<SearchableChipSelect
				items={ ITEMS.slice( 0, 3 ) }
				statusContent="Loading…"
			/>
		);

		await user.click( screen.getByRole( 'combobox' ) );

		const status = await screen.findByText( 'Loading…' );
		await expect.element( status ).toBeVisible();
		expect( status ).toHaveAttribute( 'role', 'status' );
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
				<SearchableChipSelect items={ [ ...ITEMS, creatableItem ] } />
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

		it( 'renders only one creatable option when custom flat children are used', async () => {
			const user = userEvent;

			await render(
				<SearchableChipSelect
					items={ [ ...ITEMS, creatableItem ] }
					children={ ( item: ( typeof ITEMS )[ 0 ] ) => (
						<SearchableChipSelect.Item
							key={ item.value }
							value={ item }
						>
							{ item.label }
						</SearchableChipSelect.Item>
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
				<SearchableChipSelect
					items={ items }
					children={ ( group: ItemGroup ) => (
						<SearchableChipSelect.Group
							key={ group.label }
							items={ group.items }
						>
							<SearchableChipSelect.GroupLabel>
								{ group.label }
							</SearchableChipSelect.GroupLabel>
							<SearchableChipSelect.Collection>
								{ ( item: Item ) => (
									<SearchableChipSelect.Item
										key={ item.value }
										value={ item }
									>
										{ item.label }
									</SearchableChipSelect.Item>
								) }
							</SearchableChipSelect.Collection>
						</SearchableChipSelect.Group>
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
				<SearchableChipSelect
					items={ items }
					onValueChange={ onValueChange }
					children={ ( group: ItemGroup ) => (
						<SearchableChipSelect.Group
							key={ group.label }
							items={ group.items }
						>
							<SearchableChipSelect.GroupLabel>
								{ group.label }
							</SearchableChipSelect.GroupLabel>
							<SearchableChipSelect.Collection>
								{ ( item: Item ) => (
									<SearchableChipSelect.Item
										key={ item.value }
										value={ item }
									>
										{ item.label }
									</SearchableChipSelect.Item>
								) }
							</SearchableChipSelect.Collection>
						</SearchableChipSelect.Group>
					) }
				/>
			);

			await user.click( screen.getByRole( 'combobox' ) );

			await waitFor( () => {
				expect(
					screen.getByRole( 'option', { name: 'Create new item' } )
				).toBeVisible();
			} );

			await user.keyboard( '{ArrowDown}{ArrowDown}{Enter}' );

			expect( onValueChange ).toHaveBeenCalledWith(
				expect.arrayContaining( [
					expect.objectContaining( { value: '__create__' } ),
				] ),
				expect.anything()
			);
		} );

		it( 'selects the creatable footer by keyboard when it is not last in a flat list', async () => {
			const user = userEvent;
			const onValueChange = vi.fn();

			await render(
				<SearchableChipSelect
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

			await user.keyboard( '{ArrowDown}{ArrowDown}{ArrowDown}{Enter}' );

			expect( onValueChange ).toHaveBeenCalledWith(
				expect.arrayContaining( [
					expect.objectContaining( { value: '__create__' } ),
				] ),
				expect.anything()
			);
		} );

		it( 'hides the creatable footer when the query matches no items', async () => {
			const user = userEvent;

			await render(
				<SearchableChipSelect
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
				<SearchableChipSelect
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
				<SearchableChipSelect
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
				<SearchableChipSelect
					items={ items }
					inputValue="Create"
					children={ ( group: ItemGroup ) => (
						<SearchableChipSelect.Group
							key={ group.label }
							items={ group.items }
						>
							<SearchableChipSelect.GroupLabel>
								{ group.label }
							</SearchableChipSelect.GroupLabel>
							<SearchableChipSelect.Collection>
								{ ( item: Item ) => (
									<SearchableChipSelect.Item
										key={ item.value }
										value={ item }
									>
										{ item.label }
									</SearchableChipSelect.Item>
								) }
							</SearchableChipSelect.Collection>
						</SearchableChipSelect.Group>
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
