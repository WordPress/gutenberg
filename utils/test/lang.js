/**
 * Internal dependencies
 */
import { camelCaseKeysDeep } from '../lang';

describe( 'camelCaseKeysDeep', () => {
	it( 'should do nothing with the primitive types', () => {
		expect( camelCaseKeysDeep( null ) ).toBe( null );
		expect( camelCaseKeysDeep( true ) ).toBe( true );
		expect( camelCaseKeysDeep( 1 ) ).toBe( 1 );
		expect( camelCaseKeysDeep( 'Name' ) ).toBe( 'Name' );
	} );

	it( 'should do nothing with an array containing the primitive values', () => {
		expect( camelCaseKeysDeep( [ null, true, 1, 'Name' ] ) ).toEqual( [ null, true, 1, 'Name' ] );
	} );

	it( 'should make keys camel case for deeply nested objects', () => {
		const input = [
			{
				type: 'initial',
				peer_id: 1,
				peer_name: 'Name',
			},
		];
		const output = [
			{
				type: 'initial',
				peerId: 1,
				peerName: 'Name',
			},
		];
		expect( camelCaseKeysDeep( input ) ).toEqual( output );
	} );
} );
