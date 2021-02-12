/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Portal } from '../index';

describe( 'props', () => {
	test( 'should render correctly', () => {
		const { container } = render(
			<Portal>
				<div>Code is Poetry - WordPress.org</div>
			</Portal>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );
} );
