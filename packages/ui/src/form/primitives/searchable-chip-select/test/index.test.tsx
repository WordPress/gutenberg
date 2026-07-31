import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';
import {
	GROUPED_ITEMS,
	type FixtureGroup,
	type FixtureItem,
} from '../../combobox/stories/fixtures';
import { ITEMS } from '../stories/fixtures';
import { SearchableChipSelect } from '../index';

describe( 'SearchableChipSelect', () => {
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

	it( 'renders grouped items in the popup', async () => {
		const user = userEvent.setup();

		render(
			<SearchableChipSelect
				items={ GROUPED_ITEMS }
				children={ ( group: FixtureGroup ) => (
					<SearchableChipSelect.Group
						key={ group.label }
						items={ group.items }
					>
						<SearchableChipSelect.GroupLabel>
							{ group.label }
						</SearchableChipSelect.GroupLabel>
						<SearchableChipSelect.Collection>
							{ ( item: FixtureItem ) => (
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

	describe( 'creatable item', () => {
		const creatableItem = {
			value: 'create',
			label: 'Create new item',
		};

		it( 'renders the creatable item in the list footer when included in items', async () => {
			const user = userEvent.setup();

			render(
				<SearchableChipSelect
					items={ [ ...ITEMS, creatableItem ] }
					creatableItem={ creatableItem }
					children={ ( item: ( typeof ITEMS )[ 0 ] ) =>
						item.value !== creatableItem.value && (
							<SearchableChipSelect.Item
								key={ item.value }
								value={ item }
							>
								{ item.label }
							</SearchableChipSelect.Item>
						)
					}
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
				value: 'create',
				label: 'Create new item: zzzzz',
			};
			const items = [
				...GROUPED_ITEMS,
				{ label: '', items: [ groupedCreatableItem ] },
			];

			render(
				<SearchableChipSelect
					items={ items }
					creatableItem={ groupedCreatableItem }
					inputValue="zzzzz"
					onValueChange={ onValueChange }
					children={ ( group: FixtureGroup ) => {
						if (
							group.items[ 0 ]?.value ===
							groupedCreatableItem.value
						) {
							return null;
						}

						return (
							<SearchableChipSelect.Group
								key={ group.label }
								items={ group.items }
							>
								<SearchableChipSelect.GroupLabel>
									{ group.label }
								</SearchableChipSelect.GroupLabel>
								<SearchableChipSelect.Collection>
									{ ( item: FixtureItem ) => (
										<SearchableChipSelect.Item
											key={ item.value }
											value={ item }
										>
											{ item.label }
										</SearchableChipSelect.Item>
									) }
								</SearchableChipSelect.Collection>
							</SearchableChipSelect.Group>
						);
					} }
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
					expect.objectContaining( { value: 'create' } ),
				] ),
				expect.anything()
			);
		} );
	} );
} );
