/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Shortcut } from '..';

describe( 'Shortcut', () => {
	it( 'should render null when no shortcut is provided', () => {
		const { container } = render( <Shortcut /> );
		expect( container ).toMatchSnapshot();
	} );

	it( 'should render a span with the shortcut text', () => {
		const shortcutText = 'meta + P';
		render( <Shortcut shortcut={ shortcutText } /> );
		const shortcut = screen.getByText( shortcutText );
		expect( shortcut ).toMatchSnapshot();
	} );

	it( 'should render a span with aria label', () => {
		const shortcutObject = {
			display: 'meta + P',
			ariaLabel: 'print',
		};
		render( <Shortcut shortcut={ shortcutObject } /> );
		const shortcut = screen.getByText( shortcutObject.display );
		expect( shortcut ).toHaveAttribute(
			'aria-label',
			shortcutObject.ariaLabel
		);
	} );
} );
