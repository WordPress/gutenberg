/**
 * Internal dependencies
 */
import { getMethodName } from '../entities';

describe( 'getMethodName', () => {
	it( 'Should return the right method name for an entity with the root kind', () => {
		const methodName = getMethodName( 'root', 'postType' );

		expect( methodName ).toEqual( 'getPostType' );
	} );

	it( 'Should include the kind in the method name', () => {
		const methodName = getMethodName( 'postType', 'book' );

		expect( methodName ).toEqual( 'getPostTypeBook' );
	} );
} );
