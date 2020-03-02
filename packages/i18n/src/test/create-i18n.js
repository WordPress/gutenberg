/**
 * Internal dependencies
 */
import { createI18n } from '..';

const strayaLocale = {
	hello: [ 'gday' ],
};

const frenchLocale = {
	hello: [ 'bonjour' ],
};

describe( 'createI18n', () => {
	test( 'instantiated with locale data', () => {
		const straya = createI18n( strayaLocale );
		expect( straya.__( 'hello' ) ).toEqual( 'gday' );
	} );
	test( 'multiple instances maintain their own distinct locale data', () => {
		const straya = createI18n();
		const french = createI18n();

		straya.setLocaleData( strayaLocale );
		french.setLocaleData( frenchLocale );

		expect( straya.__( 'hello' ) ).toEqual( 'gday' );
		expect( french.__( 'hello' ) ).toEqual( 'bonjour' );
	} );
} );
