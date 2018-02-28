/**
 * Internal dependencies
 */
import { validateNamespacedId } from '../plugins';

describe( 'validatePluginId', () => {
	it( 'accepts a valid plugin id', () => {
		expect( validateNamespacedId( 'gutenberg/plugin' ) ).toBe( true );
	} );

	it( 'rejects a pluginId with special characters besides a single "/"', () => {
		const valid = validateNamespacedId( 'gutenberg//plugin' );
		expect( console ).toHaveErrored();
		expect( valid ).toBe( false );
	} );

	it( 'rejects a pluginId that\'s a number', () => {
		expect( validateNamespacedId( 1 ) ).toBe( false );
		expect( console ).toHaveErrored();
	} );

	it( 'rejects a pluginId that\'s an object', () => {
		expect( validateNamespacedId( {} ) ).toBe( false );
		expect( console ).toHaveErrored();
	} );
} );
