/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import useInstanceId from '../';

describe( 'useInstanceId', () => {
	const TestComponent = () => {
		return useInstanceId( TestComponent );
	};

	it( 'should manage ids', async () => {
		const { container, rerender } = render( <TestComponent /> );

		expect( container ).toHaveTextContent( '0' );

		rerender(
			<div>
				<TestComponent />
			</div>
		);

		expect( container ).toHaveTextContent( '1' );
	} );
} );
