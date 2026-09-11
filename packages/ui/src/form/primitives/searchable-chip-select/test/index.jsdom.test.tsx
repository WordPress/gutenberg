import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';
import warning from '@wordpress/warning';
import { SearchableChipSelect } from '../index';
import type { Item, ItemGroup } from '../types';
import { GROUPED_ITEMS, ITEMS } from './__fixtures__';

vi.mock( import( '@wordpress/warning' ), () => ( { default: vi.fn() } ) );

const mockedWarning = vi.mocked( warning );

describe( 'SearchableChipSelect', () => {
	beforeEach( () => {
		mockedWarning.mockClear();
	} );

	it( 'forwards ref to the search input', () => {
		const ref = createRef< HTMLInputElement >();

		render(
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

	it( 'passes aria-label and aria-describedby props to the appropriate components', () => {
		render(
			<>
				<SearchableChipSelect
					aria-label="My label"
					aria-describedby="searchable-chip-select-description"
				/>
				{ /* eslint-disable-next-line no-restricted-syntax -- stable test ids */ }
				<p id="searchable-chip-select-description">My description</p>
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
				<p id="searchable-chip-select-label">My label</p>
				<SearchableChipSelect aria-labelledby="searchable-chip-select-label" />
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
		const items = ITEMS.slice( 0, 3 );

		render( <SearchableChipSelect items={ items } /> );

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
		expect( screen.getByText( 'Berries' ) ).toBeVisible();
		expect( screen.getByText( 'Apple' ) ).toBeVisible();
		expect( screen.getByText( 'Strawberry' ) ).toBeVisible();
	} );

	it( 'selects a grouped item', async () => {
		const user = userEvent.setup();
		const onValueChange = vi.fn();

		render(
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
		expect(
			screen.getByRole( 'button', { name: 'Remove' } )
		).toBeVisible();
	} );

	it( 'announces statusContent in a status live region', async () => {
		const user = userEvent.setup();

		render(
			<SearchableChipSelect
				items={ ITEMS.slice( 0, 3 ) }
				statusContent="Loading…"
			/>
		);

		await user.click( screen.getByRole( 'combobox' ) );

		const status = await screen.findByText( 'Loading…' );
		expect( status ).toBeVisible();
		expect( status ).toHaveAttribute( 'role', 'status' );
	} );

	it( 'keeps the status live region mounted when statusContent is cleared', async () => {
		const user = userEvent.setup();
		const { rerender } = render(
			<SearchableChipSelect
				items={ ITEMS.slice( 0, 3 ) }
				statusContent="Loading…"
			/>
		);

		await user.click( screen.getByRole( 'combobox' ) );

		const status = await screen.findByText( 'Loading…' );

		rerender(
			<SearchableChipSelect
				items={ ITEMS.slice( 0, 3 ) }
				statusContent={ null }
			/>
		);

		expect( status ).toBeVisible();
		expect( status ).toHaveAttribute( 'role', 'status' );
		expect( status ).toBeEmptyDOMElement();
	} );

	it( 'does not announce a result count by default', async () => {
		const user = userEvent.setup();

		render( <SearchableChipSelect items={ ITEMS.slice( 0, 3 ) } /> );

		await user.click( screen.getByRole( 'combobox' ) );

		expect(
			await screen.findByRole( 'option', { name: 'Apple' } )
		).toBeVisible();
		expect(
			screen.queryByText( /^\d+ results? found\.$/ )
		).not.toBeInTheDocument();
	} );

	it( 'does not announce a result count when there are no matching items', async () => {
		const user = userEvent.setup();

		render( <SearchableChipSelect items={ ITEMS.slice( 0, 3 ) } /> );

		await user.click( screen.getByRole( 'combobox' ) );
		await user.type( screen.getByRole( 'combobox' ), 'zzz' );

		expect( await screen.findByText( 'No results found.' ) ).toBeVisible();
		expect(
			screen.queryByText( /^\d+ results? found\.$/ )
		).not.toBeInTheDocument();
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
				<SearchableChipSelect items={ [ ...ITEMS, creatableItem ] } />
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

		it( 'renders only one creatable option when custom flat children are used', async () => {
			const user = userEvent.setup();

			render(
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
			const user = userEvent.setup();
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

			render(
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
			expect( screen.getByText( 'Apple' ) ).toBeVisible();
			expect(
				screen.getAllByRole( 'option', { name: 'Create new item' } )
			).toHaveLength( 1 );
		} );

		it( 'selects the creatable item by keyboard when grouped children are used', async () => {
			const user = userEvent.setup();
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

			render(
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
			const user = userEvent.setup();
			const onValueChange = vi.fn();

			render(
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
			const user = userEvent.setup();

			render(
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
			const user = userEvent.setup();

			render(
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
			const user = userEvent.setup();

			render(
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
			const user = userEvent.setup();
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

			render(
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

	describe( 'development warnings', () => {
		it( 'warns when grouped items are used without children', () => {
			render( <SearchableChipSelect items={ GROUPED_ITEMS } /> );

			expect( mockedWarning ).toHaveBeenCalledWith(
				'SearchableChipSelect: grouped `items` require a `children` renderer. See the `Grouped` story for an example.'
			);
		} );

		it( 'warns when multiple creatable items are provided', () => {
			render(
				<SearchableChipSelect
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
				'SearchableChipSelect: expected at most one item with `creatable: true` in `items`.'
			);
		} );

		it( 'warns when a group mixes regular items with a creatable item', () => {
			render(
				<SearchableChipSelect
					items={ [
						{
							label: 'Common',
							items: [
								GROUPED_ITEMS[ 0 ].items[ 0 ],
								{
									value: '__create__',
									label: 'Create new item',
									creatable: true,
								},
							],
						},
					] }
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

			expect( mockedWarning ).toHaveBeenCalledWith(
				'SearchableChipSelect: do not mix `creatable: true` items with regular items in the same group. Put the creatable item in its own group.'
			);
		} );
	} );
} );
