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
				<div>Some people are worth melting for.</div>
			</Portal>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );
} );
