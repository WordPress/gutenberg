import { render, screen } from '@testing-library/react';
import { ValidityIndicator } from '../index';

describe( 'ValidityIndicator', () => {
	it( 'renders the message', () => {
		render( <ValidityIndicator type="invalid" message="Invalid value" /> );

		expect( screen.getByText( 'Invalid value' ) ).toBeVisible();
	} );

	it( 'applies the id so it can be referenced via aria-describedby', () => {
		const id = 'indicator-id';
		render(
			<ValidityIndicator
				id={ id }
				type="invalid"
				message="Invalid value"
			/>
		);

		expect( screen.getByText( 'Invalid value' ) ).toHaveAttribute(
			'id',
			'indicator-id'
		);
	} );
} );
