import { render, screen } from '@testing-library/react';
import { createRef, useId } from '@wordpress/element';
import { SearchableSelect } from '../index';

describe( 'SearchableSelect', () => {
	it( 'forwards ref', () => {
		const ref = createRef< HTMLButtonElement >();

		render( <SearchableSelect ref={ ref } /> );

		expect( ref.current ).toBeInstanceOf( HTMLButtonElement );
	} );

	it( 'passes aria-label and aria-describedby props to the appropriate components', () => {
		function TestComponent() {
			const descriptionId = useId();

			return (
				<>
					<SearchableSelect
						aria-label="My label"
						aria-describedby={ descriptionId }
					/>
					<p id={ descriptionId }>My description</p>
				</>
			);
		}

		render( <TestComponent /> );

		expect(
			screen.getByRole( 'combobox', {
				name: 'My label',
				description: 'My description',
			} )
		).toBeVisible();
	} );

	it( 'passes aria-labelledby prop to the appropriate component', () => {
		function TestComponent() {
			const labelId = useId();

			return (
				<>
					<p id={ labelId }>My label</p>
					<SearchableSelect aria-labelledby={ labelId } />
				</>
			);
		}

		render( <TestComponent /> );

		expect(
			screen.getByRole( 'combobox', {
				name: 'My label',
			} )
		).toBeVisible();
	} );
} );
