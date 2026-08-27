import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';
import warning from '@wordpress/warning';
import { SearchableSelect } from '../index';
import type { Item } from '../types';

const ITEMS: Item[] = [
	{ value: 'apple', label: 'Apple' },
	{ value: 'apricot', label: 'Apricot' },
	{ value: 'banana', label: 'Banana' },
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
