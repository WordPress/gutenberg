/**
 * Internal dependencies
 */
import { sprintf, __, _x, _n, _nx, setLocaleData } from '../';

// Mock memoization as identity function. Inline since Jest errors on out-of-
// scope references in a mock callback.
jest.mock( 'memize', () => ( fn ) => fn );

const localeData = {
	'': {
		// Domain name
		domain: 'test_domain',
		lang: 'fr',
		// Plural form function for language
		plural_forms: 'nplurals=2; plural=(n != 1);',
	},

	hello: [ 'bonjour' ],

	'verb\u0004feed': [ 'nourrir' ],

	'hello %s': [ 'bonjour %s' ],

	'%d banana': [ '%d banane', '%d bananes' ],

	'fruit\u0004%d apple': [ '%d pomme', '%d pommes' ],
};
const additionalLocaleData = {
	cheeseburger: [ 'hamburger au fromage' ],
	'%d cat': [ '%d chat', '%d chats' ],
};

setLocaleData( localeData, 'test_domain' );

describe( 'i18n', () => {
	describe( '__', () => {
		it( 'use the translation', () => {
			expect( __( 'hello', 'test_domain' ) ).toBe( 'bonjour' );
		} );
	} );

	describe( '_x', () => {
		it( 'use the translation with context', () => {
			expect( _x( 'feed', 'verb', 'test_domain' ) ).toBe( 'nourrir' );
		} );
	} );

	describe( '_n', () => {
		it( 'use the plural form', () => {
			expect( _n( '%d banana', '%d bananas', 3, 'test_domain' ) ).toBe( '%d bananes' );
		} );

		it( 'use the singular form', () => {
			expect( _n( '%d banana', '%d bananas', 1, 'test_domain' ) ).toBe( '%d banane' );
		} );
	} );

	describe( '_nx', () => {
		it( 'use the plural form', () => {
			expect( _nx( '%d apple', '%d apples', 3, 'fruit', 'test_domain' ) ).toBe( '%d pommes' );
		} );

		it( 'use the singular form', () => {
			expect( _nx( '%d apple', '%d apples', 1, 'fruit', 'test_domain' ) ).toBe( '%d pomme' );
		} );
	} );

	describe( 'sprintf()', () => {
		it( 'absorbs errors', () => {
			// Disable reason: Failing case is the purpose of the test.
			// eslint-disable-next-line @wordpress/valid-sprintf
			const result = sprintf( 'Hello %(placeholder-not-provided)s' );

			expect( console ).toHaveErrored();
			expect( result ).toBe( 'Hello %(placeholder-not-provided)s' );
		} );

		it( 'replaces placeholders', () => {
			const result = sprintf( __( 'hello %s', 'test_domain' ), 'Riad' );

			expect( result ).toBe( 'bonjour Riad' );
		} );
	} );

	describe( 'setLocaleData', () => {
		beforeAll( () => {
			setLocaleData( additionalLocaleData, 'test_domain' );
		} );

		it( 'supports omitted plural forms expression', () => {
			setLocaleData( {
				'': {
					domain: 'test_domain2',
					lang: 'fr',
				},

				'%d banana': [ '%d banane', '%d bananes' ],
			}, 'test_domain2' );

			expect( _n( '%d banana', '%d bananes', 2, 'test_domain2' ) ).toBe( '%d bananes' );
		} );

		describe( '__', () => {
			it( 'existing translation still available', () => {
				expect( __( 'hello', 'test_domain' ) ).toBe( 'bonjour' );
			} );

			it( 'new translation available.', () => {
				expect( __( 'cheeseburger', 'test_domain' ) ).toBe( 'hamburger au fromage' );
			} );
		} );

		describe( '_n', () => {
			it( 'existing plural form still works', () => {
				expect( _n( '%d banana', '%d bananas', 3, 'test_domain' ) ).toBe( '%d bananes' );
			} );

			it( 'new singular form was added', () => {
				expect( _n( '%d cat', '%d cats', 1, 'test_domain' ) ).toBe( '%d chat' );
			} );

			it( 'new plural form was added', () => {
				expect( _n( '%d cat', '%d cats', 3, 'test_domain' ) ).toBe( '%d chats' );
			} );
		} );
	} );
} );
