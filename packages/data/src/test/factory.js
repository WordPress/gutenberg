/**
 * Internal dependencies
 */
import { __unstableCreateStoreDefinition } from '../factory';

describe( '__unstableCreateStoreDefinition', () => {
	it( 'creates store definition', () => {
		const result = __unstableCreateStoreDefinition( 'my-shop' );

		expect( result.name ).toBe( 'my-shop' );
	} );

	it( 'casts the definition to string', () => {
		const result = __unstableCreateStoreDefinition( 'my-shop' );

		expect( String( result ) ).toBe( 'my-shop' );
	} );
} );
