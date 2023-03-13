/**
 * Internal dependencies
 */
import { isRawAttribute } from '../';

describe( 'isRawAttribute', () => {
	it( 'should correctly assess that the attribute is not raw', () => {
		const entityConfig = {
			kind: 'someKind',
			name: 'someName',
		};
		expect( isRawAttribute( entityConfig, 'title' ) ).toBe( false );
	} );
	it( 'should correctly assess that the attribute is raw', () => {
		const entityConfig = {
			kind: 'someKind',
			name: 'someName',
			rawAttributes: [ 'title' ],
		};
		expect( isRawAttribute( entityConfig, 'title' ) ).toBe( true );
	} );
} );
