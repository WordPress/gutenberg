/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import Shortcut from '..';

describe( 'Shortcut', () => {
	it( 'does not render anything if no shortcut prop is provided', () => {
		const { container } = render( <Shortcut /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders the shortcut display text when a string is passed as the shortcut', () => {
		render( <Shortcut shortcut="shortcut text" /> );
		expect( screen.getByText( 'shortcut text' ) ).toMatchSnapshot();
	} );

	it( 'renders the shortcut display text and aria-label when an object is passed as the shortcut with the correct properties', () => {
		render(
			<Shortcut
				shortcut={ {
					display: 'shortcut text',
					ariaLabel: 'shortcut label',
				} }
			/>
		);

		expect( screen.getByLabelText( 'shortcut label' ) ).toHaveTextContent(
			'shortcut text'
		);
	} );

	it( 'renders passed className', () => {
		render( <Shortcut shortcut="shortcut text" className="my-class" /> );
		expect( screen.getByText( 'shortcut text' ) ).toMatchSnapshot();
	} );
} );
