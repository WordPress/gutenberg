import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';
import warning from '@wordpress/warning';
import { SearchableChipSelect } from '../index';
import type { Item, ItemGroup } from '../types';
import { GROUPED_ITEMS, ITEMS } from './__fixtures__';

jest.mock( '@wordpress/warning', () => jest.fn() );

const mockedWarning = warning as jest.MockedFunction< typeof warning >;

describe( 'SearchableChipSelect', () => {
	beforeEach( () => {
		mockedWarning.mockClear();
	} );

	it( 'forwards ref', () => {
		const ref = createRef< HTMLDivElement >();

		render( <SearchableChipSelect ref={ ref } /> );

		expect( ref.current ).toBeInstanceOf( HTMLDivElement );
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
		const onValueChange = jest.fn();

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
				<SearchableChipSelect
					items={ items }
					inputValue="zzzzz"
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
					screen.getByRole( 'option', {
						name: 'Create new item: zzzzz',
					} )
				).toBeVisible();
			} );

			await user.keyboard( '{ArrowDown}{Enter}' );

			expect( onValueChange ).toHaveBeenCalledWith(
				expect.arrayContaining( [
					expect.objectContaining( { value: '__create__' } ),
				] ),
				expect.anything()
			);
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
	} );
} );
