/**
 * Internal dependencies
 */
import { isAppleOS } from '../platform';

describe( 'isAppleOS helper', () => {
	it( 'should identify anything with "Mac" in it as Apple OS', () => {
		expect( isAppleOS( { navigator: { platform: 'Mac' } } ) ).toEqual( true );
		expect( isAppleOS( { navigator: { platform: 'MacIntel' } } ) ).toEqual( true );
	} );

	it( 'should identify "iPad" as Apple OS', () => {
		expect( isAppleOS( { navigator: { platform: 'iPad' } } ) ).toEqual( true );
	} );

	it( 'should identify "iPhone" as Apple OS', () => {
		expect( isAppleOS( { navigator: { platform: 'iPhone' } } ) ).toEqual( true );
	} );

	it( 'should not identify Windows as MacOS', () => {
		expect( isAppleOS( { navigator: { platform: 'Windows' } } ) ).toEqual( false );
		expect( isAppleOS( { navigator: { platform: 'Win' } } ) ).toEqual( false );
	} );

	it( 'should not identify *NIX as MacOS', () => {
		expect( isAppleOS( { navigator: { platform: 'Linux' } } ) ).toEqual( false );
		expect( isAppleOS( { navigator: { platform: 'Unix' } } ) ).toEqual( false );
	} );

	it( 'should not identify other cases as MacOS', () => {
		expect( isAppleOS( { navigator: { platform: 'MAC' } } ) ).toEqual( false );
		expect( isAppleOS( { navigator: { platform: 'mac' } } ) ).toEqual( false );
	} );
} );
