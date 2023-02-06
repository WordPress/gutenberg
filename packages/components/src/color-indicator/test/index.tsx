/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import ColorIndicator from '..';

describe( 'ColorIndicator', () => {
	it( 'matches the snapshot', () => {
		const { container } = render(
			<ColorIndicator aria-label="sample label" colorValue="#fff" />
		);

		expect( container ).toMatchSnapshot();
	} );
} );
