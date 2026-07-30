import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';
import { SearchableChipSelectControl } from '../index';

describe( 'SearchableChipSelectControl', () => {
	const mockItems = [
		{ value: 'apple', label: 'Apple' },
		{ value: 'banana', label: 'Banana' },
		{ value: 'cherry', label: 'Cherry' },
	];

	it( 'forwards ref', async () => {
		const user = userEvent.setup();
		const ref = createRef< HTMLDivElement >();
		const itemRef = createRef< HTMLDivElement >();
		const chipRef = createRef< HTMLDivElement >();

		render(
			<SearchableChipSelectControl
				ref={ ref }
				label="Select options"
				items={ mockItems }
				defaultValue={ [ mockItems[ 0 ] ] }
				chipsContent={ ( value ) =>
					value.map( ( item ) => (
						<SearchableChipSelectControl.ChipWithRemove
							key={ item.value }
							ref={ chipRef }
						>
							{ item.label }
						</SearchableChipSelectControl.ChipWithRemove>
					) )
				}
			>
				{ ( item ) => (
					<SearchableChipSelectControl.Item
						key={ item.value }
						ref={ item.value === 'apple' ? itemRef : undefined }
						value={ item }
					>
						{ item.label }
					</SearchableChipSelectControl.Item>
				) }
			</SearchableChipSelectControl>
		);

		expect( ref.current ).toBeInstanceOf( HTMLDivElement );
		expect( chipRef.current ).toBeInstanceOf( HTMLDivElement );

		await user.click( screen.getByRole( 'combobox' ) );

		await waitFor( () => {
			expect( itemRef.current ).toBeInstanceOf( HTMLDivElement );
		} );
	} );

	it( 'renders accessible label and description', () => {
		render(
			<SearchableChipSelectControl
				label="Fruits"
				description="Choose your favorite fruits"
				items={ mockItems }
			/>
		);

		expect(
			screen.getByRole( 'combobox', {
				name: 'Fruits',
				description: 'Choose your favorite fruits',
			} )
		).toBeVisible();
	} );
} );
