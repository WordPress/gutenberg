/* eslint-disable @wordpress/i18n-text-domain, @wordpress/i18n-translator-comments */

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

const createTestLocale = () => createI18n( localeData, 'test_domain' );
const createTestLocaleWithAdditionalData = () => {
	const locale = createI18n( localeData, 'test_domain' );
	locale.setLocaleData( additionalLocaleData, 'test_domain' );
	return locale;
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

	describe( '__', () => {
		it( 'use the translation', () => {
			const locale = createTestLocale();
			expect( locale.__( 'hello', 'test_domain' ) ).toBe( 'bonjour' );
		} );
	} );

	describe( '_x', () => {
		it( 'use the translation with context', () => {
			const locale = createTestLocale();
			expect( locale._x( 'feed', 'verb', 'test_domain' ) ).toBe(
				'nourrir'
			);
		} );
	} );

	describe( '_n', () => {
		it( 'use the plural form', () => {
			const locale = createTestLocale();
			expect(
				locale._n( '%d banana', '%d bananas', 3, 'test_domain' )
			).toBe( '%d bananes' );
		} );

		it( 'use the singular form', () => {
			const locale = createTestLocale();
			expect(
				locale._n( '%d banana', '%d bananas', 1, 'test_domain' )
			).toBe( '%d banane' );
		} );
	} );

	describe( '_nx', () => {
		it( 'use the plural form', () => {
			const locale = createTestLocale();
			expect(
				locale._nx( '%d apple', '%d apples', 3, 'fruit', 'test_domain' )
			).toBe( '%d pommes' );
		} );

		it( 'use the singular form', () => {
			const locale = createTestLocale();
			expect(
				locale._nx( '%d apple', '%d apples', 1, 'fruit', 'test_domain' )
			).toBe( '%d pomme' );
		} );
	} );

	describe( 'isRTL', () => {
		const ARLocaleData = {
			'': {
				plural_forms:
					'nplurals=6; plural=n==0 ? 0 : n==1 ? 1 : n==2 ? 2 : n%100>=3 && n%100<=10 ? 3 : n%100>=11 && n%100<=99 ? 4 : 5;',
				language: 'ar',
				localeSlug: 'ar',
			},
			'text direction\u0004ltr': [ 'rtl' ],
			Back: [ 'رجوع' ],
		};

		it( 'is false for non-rtl', () => {
			const locale = createI18n();
			expect( locale.isRTL() ).toBe( false );
		} );

		it( 'is true for rtl', () => {
			const locale = createI18n( ARLocaleData );
			expect( locale.isRTL() ).toBe( true );
		} );
	} );

	describe( 'setLocaleData', () => {
		it( 'supports omitted plural forms expression', () => {
			const locale = createTestLocaleWithAdditionalData();
			locale.setLocaleData(
				{
					'': {
						domain: 'test_domain2',
						lang: 'fr',
					},

					'%d banana': [ '%d banane', '%d bananes' ],
				},
				'test_domain2'
			);
			expect(
				locale._n( '%d banana', '%d bananes', 2, 'test_domain2' )
			).toBe( '%d bananes' );
		} );

		describe( '__', () => {
			it( 'existing translation still available', () => {
				const locale = createTestLocaleWithAdditionalData();
				expect( locale.__( 'hello', 'test_domain' ) ).toBe( 'bonjour' );
			} );

			it( 'new translation available.', () => {
				const locale = createTestLocaleWithAdditionalData();
				expect( locale.__( 'cheeseburger', 'test_domain' ) ).toBe(
					'hamburger au fromage'
				);
			} );
		} );

		describe( '_n', () => {
			it( 'existing plural form still works', () => {
				const locale = createTestLocaleWithAdditionalData();
				expect(
					locale._n( '%d banana', '%d bananas', 3, 'test_domain' )
				).toBe( '%d bananes' );
			} );

			it( 'new singular form was added', () => {
				const locale = createTestLocaleWithAdditionalData();
				expect(
					locale._n( '%d cat', '%d cats', 1, 'test_domain' )
				).toBe( '%d chat' );
			} );

			it( 'new plural form was added', () => {
				const locale = createTestLocaleWithAdditionalData();
				expect(
					locale._n( '%d cat', '%d cats', 3, 'test_domain' )
				).toBe( '%d chats' );
			} );
		} );
	} );
} );

describe( 'i18n filters', () => {
	test( '__() calls filters', () => {
		const i18n = createI18n( undefined, undefined, {
			applyFilters: ( filter, translation ) => translation + filter,
		} );
		expect( i18n.__( 'hello' ) ).toEqual(
			'helloi18n.gettexti18n.gettext_default'
		);
		expect( i18n.__( 'hello', 'domain' ) ).toEqual(
			'helloi18n.gettexti18n.gettext_domain'
		);
	} );
	test( '_x() calls filters', () => {
		const i18n = createI18n( undefined, undefined, {
			applyFilters: ( filter, translation ) => translation + filter,
		} );
		expect( i18n._x( 'hello', 'context' ) ).toEqual(
			'helloi18n.gettext_with_contexti18n.gettext_with_context_default'
		);
		expect( i18n._x( 'hello', 'context', 'domain' ) ).toEqual(
			'helloi18n.gettext_with_contexti18n.gettext_with_context_domain'
		);
	} );
	test( '_n() calls filters', () => {
		const i18n = createI18n( undefined, undefined, {
			applyFilters: ( filter, translation ) => translation + filter,
		} );
		expect( i18n._n( 'hello', 'hellos', 1 ) ).toEqual(
			'helloi18n.ngettexti18n.ngettext_default'
		);
		expect( i18n._n( 'hello', 'hellos', 1, 'domain' ) ).toEqual(
			'helloi18n.ngettexti18n.ngettext_domain'
		);
		expect( i18n._n( 'hello', 'hellos', 2 ) ).toEqual(
			'hellosi18n.ngettexti18n.ngettext_default'
		);
		expect( i18n._n( 'hello', 'hellos', 2, 'domain' ) ).toEqual(
			'hellosi18n.ngettexti18n.ngettext_domain'
		);
	} );
	test( '_nx() calls filters', () => {
		const i18n = createI18n( undefined, undefined, {
			applyFilters: ( filter, translation ) => translation + filter,
		} );
		expect( i18n._nx( 'hello', 'hellos', 1, 'context' ) ).toEqual(
			'helloi18n.ngettext_with_contexti18n.ngettext_with_context_default'
		);
		expect( i18n._nx( 'hello', 'hellos', 1, 'context', 'domain' ) ).toEqual(
			'helloi18n.ngettext_with_contexti18n.ngettext_with_context_domain'
		);
		expect( i18n._nx( 'hello', 'hellos', 2, 'context' ) ).toEqual(
			'hellosi18n.ngettext_with_contexti18n.ngettext_with_context_default'
		);
		expect( i18n._nx( 'hello', 'hellos', 2, 'context', 'domain' ) ).toEqual(
			'hellosi18n.ngettext_with_contexti18n.ngettext_with_context_domain'
		);
	} );
} );

/* eslint-enable @wordpress/i18n-text-domain, @wordpress/i18n-translator-comments */
