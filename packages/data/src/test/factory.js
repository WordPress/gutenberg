/**
 * Internal dependencies
 */
import { createStoreDefinition } from '../factory';

describe( 'createStoreDefinition', () => {
	it( 'creates store definition', () => {
		const result = createStoreDefinition( 'my-shop' );

		expect( result.name ).toBe( 'my-shop' );
	} );

	it( 'casts the definition to string', () => {
		const result = createStoreDefinition( 'my-shop' );

		expect( String( result ) ).toBe( 'my-shop' );
	} );
} );
