import { render, screen } from '@testing-library/react';
import { createRef, useId } from '@wordpress/element';
import { SearchableChipSelect } from '../index';

function SearchableChipSelectWithDescription() {
	const descriptionId = useId();

	return (
		<>
			<SearchableChipSelect
				aria-label="My label"
				aria-describedby={ descriptionId }
			/>
			<p id={ descriptionId }>My description</p>
		</>
	);
}

function SearchableChipSelectWithLabel() {
	const labelId = useId();

	return (
		<>
			<p id={ labelId }>My label</p>
			<SearchableChipSelect aria-labelledby={ labelId } />
		</>
	);
}

describe( 'SearchableChipSelect', () => {
	it( 'forwards ref', () => {
		const ref = createRef< HTMLDivElement >();

		render( <SearchableChipSelect ref={ ref } /> );

		expect( ref.current ).toBeInstanceOf( HTMLDivElement );
	} );

	it( 'passes aria-label and aria-describedby props to the appropriate components', () => {
		render( <SearchableChipSelectWithDescription /> );

		expect(
			screen.getByRole( 'combobox', {
				name: 'My label',
				description: 'My description',
			} )
		).toBeVisible();
	} );

	it( 'passes aria-labelledby prop to the appropriate component', () => {
		render( <SearchableChipSelectWithLabel /> );

		expect(
			screen.getByRole( 'combobox', {
				name: 'My label',
			} )
		).toBeVisible();
	} );
} );
