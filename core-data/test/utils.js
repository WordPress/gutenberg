/**
 * Internal dependencies
 */
import { getRequestId } from '../utils';

describe( 'getRequestId', () => {
	it( 'returns the default id if no args', () => {
		expect( getRequestId() ).toBe( '[[default]]' );
	} );

	it( 'returns the scalar if scalar', () => {
		expect( getRequestId( 'myId' ) ).toBe( 'myId' );
	} );

	it( 'returns a JSON encoded object if object', () => {
		expect( getRequestId( { id: 'myId' } ) ).toBe( '{"id":"myId"}' );
	} );
} );
