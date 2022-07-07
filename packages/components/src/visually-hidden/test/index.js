/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { VisuallyHidden } from '..';

describe( 'VisuallyHidden', () => {
	it( 'should render correctly', () => {
		const { container } = render(
			<VisuallyHidden>This is hidden</VisuallyHidden>
		);

		expect( container.firstChild ).toMatchSnapshot();
	} );
} );
