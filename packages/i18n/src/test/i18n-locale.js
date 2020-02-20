/**
 * Internal dependencies
 */
import I18nLocale from '../i18n-locale';

describe( 'I18nLocale', () => {
	it( 'should provide translation functions', () => {
		const identity = new I18nLocale();
		expect( identity.__( 'Hello, world!' ) ).toBe( 'Hello, world!' );
	} );

	it( 'should initialize with locale data', () => {
		const esLocale = new I18nLocale( {
			'Hello, world!': [ 'Hola, mundo!' ],
		} );
		expect( esLocale.__( 'Hello, world!' ) ).toBe( 'Hola, mundo!' );
	} );

	it( 'should initialize with locale data and domain', () => {
		const esLocale = new I18nLocale(
			{
				'Hello, world!': [ 'Hola, mundo!' ],
			},
			'my-domain'
		);
		expect( esLocale.__( 'Hello, world!' ) ).toBe( 'Hello, world!' );
		expect( esLocale.__( 'Hello, world!', 'my-domain' ) ).toBe(
			'Hola, mundo!'
		);
	} );

	it( 'should have isolated instances', () => {
		const identity = new I18nLocale();
		const esLocale = new I18nLocale( {
			'Hello, world!': [ 'Hola, mundo!' ],
		} );
		expect( identity.__( 'Hello, world!' ) ).toBe( 'Hello, world!' );
		expect( esLocale.__( 'Hello, world!' ) ).toBe( 'Hola, mundo!' );
	} );
} );
