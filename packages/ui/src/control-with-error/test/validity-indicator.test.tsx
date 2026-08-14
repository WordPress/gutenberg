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

	// The icon and spinner are decorative, so they are not reachable through
	// accessible Testing Library queries and are asserted on structurally.
	/* eslint-disable testing-library/no-node-access */
	it.each( [ 'valid', 'invalid' ] as const )(
		'renders a status icon when type is "%s"',
		( type ) => {
			render( <ValidityIndicator type={ type } message="Message" /> );

			const indicator = screen.getByText( 'Message' );
			expect(
				indicator.querySelector( 'svg[aria-hidden="true"]' )
			).toBeInTheDocument();
			expect(
				indicator.querySelector( 'svg[role="presentation"]' )
			).not.toBeInTheDocument();
		}
	);

	it( 'renders a spinner when type is "validating"', () => {
		render( <ValidityIndicator type="validating" message="Validating…" /> );

		const indicator = screen.getByText( 'Validating…' );
		expect(
			indicator.querySelector( 'svg[role="presentation"]' )
		).toBeInTheDocument();
		expect(
			indicator.querySelector( 'svg[aria-hidden="true"]' )
		).not.toBeInTheDocument();
	} );
	/* eslint-enable testing-library/no-node-access */
} );
