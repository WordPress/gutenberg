/**
 * External dependencies
 */
import { screen } from '@testing-library/react';
import { render } from '@ariakit/test/react';

/**
 * Internal dependencies
 */
import { VisuallyHidden } from '..';

describe( 'VisuallyHidden', () => {
	it( 'should render correctly', async () => {
		const text = 'This is hidden';
		await render( <VisuallyHidden>{ text }</VisuallyHidden> );
		expect( screen.getByText( text ) ).toMatchSnapshot();
	} );
} );
