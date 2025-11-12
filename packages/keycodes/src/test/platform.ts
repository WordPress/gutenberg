/**
 * Internal dependencies
 */
import { isAppleOS } from '../platform';

describe( 'isAppleOS helper', () => {
	it( 'should identify anything with "Mac" in it as Apple OS', () => {
		expect(
			isAppleOS( { navigator: { platform: 'Mac' } } as Window )
		).toEqual( true );
		expect(
			isAppleOS( { navigator: { platform: 'MacIntel' } } as Window )
		).toEqual( true );
	} );

	it( 'should identify "iPad" as Apple OS', () => {
		expect(
			isAppleOS( { navigator: { platform: 'iPad' } } as Window )
		).toEqual( true );
	} );

	it( 'should identify "iPhone" as Apple OS', () => {
		expect(
			isAppleOS( { navigator: { platform: 'iPhone' } } as Window )
		).toEqual( true );
	} );

	it( 'should not identify Windows as MacOS', () => {
		expect(
			isAppleOS( {
				navigator: { platform: 'Windows' },
			} as Window )
		).toEqual( false );
		expect(
			isAppleOS( { navigator: { platform: 'Win' } } as Window )
		).toEqual( false );
	} );

	it( 'should not identify *NIX as MacOS', () => {
		expect(
			isAppleOS( { navigator: { platform: 'Linux' } } as Window )
		).toEqual( false );
		expect(
			isAppleOS( { navigator: { platform: 'Unix' } } as Window )
		).toEqual( false );
	} );

	it( 'should not identify other cases as MacOS', () => {
		expect(
			isAppleOS( { navigator: { platform: 'MAC' } } as Window )
		).toEqual( false );
		expect(
			isAppleOS( { navigator: { platform: 'mac' } } as Window )
		).toEqual( false );
	} );
} );
