/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { VisuallyHidden, useVisuallyHidden } from '..';

describe( 'useVisuallyHidden', () => {
	it( 'should apply the expected classnames', () => {
		const { className } = useVisuallyHidden( {
			className: 'my-custom-classname',
		} );
		expect( className ).toContain( 'my-custom-classname' );
		expect( className ).toContain( 'components-visually-hidden' );
	} );
} );

describe( 'VisuallyHidden', () => {
	it( 'should render correctly', () => {
		const { container } = render(
			<VisuallyHidden>This is hidden</VisuallyHidden>
		);

		expect( container.firstChild ).toMatchSnapshot();
	} );
} );
