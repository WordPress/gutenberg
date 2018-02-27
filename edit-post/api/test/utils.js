import '@wordpress/jest-console';
import { validatePluginId } from '../utils';

describe( 'validatePluginId', () => {
	it( 'accepts a valid plugin id', () => {
		expect( validatePluginId( 'gutenberg/plugin' ) ).toBe( true );
	} );

	it( 'rejects a pluginId with special characters besides a single "/"', () => {
		const valid = validatePluginId( 'gutenberg//plugin' );
		expect( console ).toHaveErrored();
		expect( valid ).toBe( false );
	} );

	it( 'rejects a pluginId that\'s a number', () => {
		expect( validatePluginId( 1 ) ).toBe( false );
		expect( console ).toHaveErrored();
	} );

	it( 'rejects a pluginId that\'s an object', () => {
		expect( validatePluginId( {} ) ).toBe( false );
		expect( console ).toHaveErrored();
	} );
} );
