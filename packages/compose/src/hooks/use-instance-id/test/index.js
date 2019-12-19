/**
 * External dependencies
 */
import { create, act } from 'react-test-renderer';

/**
 * Internal dependencies
 */
import useInstanceId from '../';

describe( 'useInstanceId', () => {
	const TestComponent = () => {
		return useInstanceId( TestComponent );
	};

	it( 'should manage ids', async () => {
		let test0;

		await act( async () => {
			test0 = create( <TestComponent /> );
		} );

		expect( test0.toJSON() ).toBe( '0' );

		let test1;

		await act( async () => {
			test1 = create( <TestComponent /> );
		} );

		expect( test1.toJSON() ).toBe( '1' );

		test0.unmount();
		test1.unmount();
	} );
} );
