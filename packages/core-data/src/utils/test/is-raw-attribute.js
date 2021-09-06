/**
 * Internal dependencies
 */
import { isRawAttribute } from '../';

describe( 'isRawAttribute', () => {
	it( 'should correctly assess that the attribute is not raw', () => {
		const entity = {
			kind: 'someKind',
			name: 'someName',
		};
		expect( isRawAttribute( entity, 'title' ) ).toBe( false );
	} );
	it( 'should correctly assess that the attribute is raw', () => {
		const entity = {
			kind: 'someKind',
			name: 'someName',
			rawAttributes: [ 'title' ],
		};
		expect( isRawAttribute( entity, 'title' ) ).toBe( true );
	} );
} );
