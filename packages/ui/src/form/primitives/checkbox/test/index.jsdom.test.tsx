import { render, screen } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import { Checkbox } from '../index';

describe( 'Checkbox', () => {
	it( 'forwards ref', () => {
		const ref = createRef< HTMLSpanElement >();

		render( <Checkbox ref={ ref } /> );

		expect( ref.current ).toBeInstanceOf( HTMLSpanElement );
	} );

	it( 'renders checked when defaultChecked is true', () => {
		render( <Checkbox defaultChecked /> );

		expect( screen.getByRole( 'checkbox' ) ).toBeChecked();
	} );

	it( 'renders indeterminate state', () => {
		render( <Checkbox indeterminate defaultChecked /> );

		expect( screen.getByRole( 'checkbox' ) ).toBePartiallyChecked();
	} );
} );
