/**
 * External dependencies
 */
import { screen } from '@testing-library/react';
import { render } from '@ariakit/test/react';

/**
 * Internal dependencies
 */
import Shortcut from '..';

describe( 'Shortcut', () => {
	it( 'does not render anything if no shortcut prop is provided', async () => {
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
		await render( <Shortcut />, { container } );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders the shortcut display text when a string is passed as the shortcut', async () => {
		await render( <Shortcut shortcut="shortcut text" /> );
		expect( screen.getByText( 'shortcut text' ) ).toMatchSnapshot();
	} );

	it( 'renders the shortcut display text and aria-label when an object is passed as the shortcut with the correct properties', async () => {
		await render(
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

	it( 'renders passed className', async () => {
		await render(
			<Shortcut shortcut="shortcut text" className="my-class" />
		);
		expect( screen.getByText( 'shortcut text' ) ).toMatchSnapshot();
	} );
} );
