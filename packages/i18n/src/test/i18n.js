/**
 * Internal dependencies
 */
import { I18n } from '../';

const strayaLocale = {
	hello: [ 'gday' ],
};

const frenchLocale = {
	hello: [ 'bonjour' ],
};

describe( 'I18n', () => {
	test( 'instantiated with locale data', () => {
		const straya = new I18n( strayaLocale );
		expect( straya.__( 'hello' ) ).toEqual( 'gday' );
	} );
	test( 'multiple instances maintain their own distinct locale data', () => {
		const straya = new I18n();
		const french = new I18n();

		straya.setLocaleData( strayaLocale );
		french.setLocaleData( frenchLocale );

		expect( straya.__( 'hello' ) ).toEqual( 'gday' );
		expect( french.__( 'hello' ) ).toEqual( 'bonjour' );
	} );
} );
