/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { VisuallyHidden } from '..';

describe( 'VisuallyHidden', () => {
	it( 'should render correctly', () => {
		const text = 'This is hidden';
		render( <VisuallyHidden>{ text }</VisuallyHidden> );
		expect( screen.getByText( text ) ).toMatchSnapshot();
	} );
} );
