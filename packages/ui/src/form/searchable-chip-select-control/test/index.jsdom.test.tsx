import { act, render, screen } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import { SearchableChipSelectControl } from '../index';

describe( 'SearchableChipSelectControl', () => {
	const mockItems = [
		{ value: 'apple', label: 'Apple' },
		{ value: 'banana', label: 'Banana' },
		{ value: 'cherry', label: 'Cherry' },
	];

	it( 'forwards ref to the search input', () => {
		const ref = createRef< HTMLInputElement >();

		render(
			<SearchableChipSelectControl
				ref={ ref }
				label="Select options"
				items={ mockItems }
			/>
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
