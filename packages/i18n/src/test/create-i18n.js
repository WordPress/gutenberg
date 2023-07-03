/* eslint-disable @wordpress/i18n-text-domain, @wordpress/i18n-translator-comments */

/**
 * WordPress dependencies
 */
import { createHooks } from '@wordpress/hooks';

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
		// Domain name.
		domain: 'test_domain',
		lang: 'fr',
		// Plural form function for language.
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
		const createTestLocaleWithAdditionalData = () => {
			const locale = createI18n( localeData, 'test_domain' );
			locale.setLocaleData( additionalLocaleData, 'test_domain' );
			return locale;
		};

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

		it( 'overwrites domain configuration', () => {
			const locale = createTestLocaleWithAdditionalData();
			const domain = 'test_domain';
			const domainConfiguration = {
				additionalData: 'This is setLocaleData',
			};
			locale.setLocaleData(
				{
					'': domainConfiguration,
				},
				domain
			);

			expect(
				locale.getLocaleData( domain )[ '' ].domain
			).toBeUndefined();
			expect( locale.getLocaleData( domain )[ '' ].lang ).toBeUndefined();
			expect( locale.getLocaleData( domain )[ '' ].additionalData ).toBe(
				domainConfiguration.additionalData
			);
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

	describe( 'addLocaleData', () => {
		const createTestLocaleWithAdditionalData = () => {
			const locale = createI18n( localeData, 'test_domain' );
			locale.addLocaleData( additionalLocaleData, 'test_domain' );
			return locale;
		};

		it( 'supports omitted plural forms expression', () => {
			const locale = createTestLocaleWithAdditionalData();
			locale.addLocaleData(
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

		it( 'merges domain configuration', () => {
			const locale = createTestLocaleWithAdditionalData();
			const domain = 'test_domain';
			const domainConfiguration = {
				additionalData: 'This is addLocaleData',
			};
			locale.addLocaleData(
				{
					'': domainConfiguration,
				},
				domain
			);

			expect( locale.getLocaleData( domain )[ '' ].domain ).toBe(
				domain
			);
			expect( locale.getLocaleData( domain )[ '' ].lang ).toBe( 'fr' );
			expect( locale.getLocaleData( domain )[ '' ].additionalData ).toBe(
				domainConfiguration.additionalData
			);
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

	describe( 'resetLocaleData', () => {
		it( 'reset the locale data', () => {
			const locale = createTestLocale();
			expect( locale.__( 'hello', 'test_domain' ) ).toBe( 'bonjour' );

			locale.resetLocaleData();
			expect( locale.__( 'hello', 'test_domain' ) ).toBe( 'hello' );
		} );

		it( 'reset the current locale data and set new locale data for the specified domain', () => {
			const locale = createTestLocale();
			expect( locale.__( 'hello', 'test_domain' ) ).toBe( 'bonjour' );

			locale.resetLocaleData( additionalLocaleData );
			expect( locale.__( 'cheeseburger' ) ).toBe(
				'hamburger au fromage'
			);

			locale.resetLocaleData( additionalLocaleData, 'test_domain2' );
			expect( locale.__( '%d cat', 'test_domain2' ) ).toBe( '%d chat' );
		} );

		it( 'reset the plural forms function cache', () => {
			const locale = createI18n( {}, 'test_domain' );

			// Call `_n` to get the plural forms function cached.
			locale._n( 'singular', 'plural', 1, 'test_domain' );

			// Reset the locale data and provide custom plural forms function.
			locale.resetLocaleData(
				{
					'': {
						domain: 'test_domain',
						lang: 'aa',
						plural_forms:
							'nplurals=3; plural=n==1 ? 0 : n==2 ? 1 : 2;',
					},
					singular: [
						'translated',
						'translated_plural_1',
						'translated_plural_2',
					],
				},
				'test_domain'
			);

			expect( locale._n( 'singular', 'plural', 1, 'test_domain' ) ).toBe(
				'translated'
			);
			expect( locale._n( 'singular', 'plural', 2, 'test_domain' ) ).toBe(
				'translated_plural_1'
			);
			expect( locale._n( 'singular', 'plural', 3, 'test_domain' ) ).toBe(
				'translated_plural_2'
			);

			// Reset the locale data and fallback to the defualt plural forms function.
			locale.resetLocaleData(
				{
					singular: [
						'translated',
						'translated_plural_1',
						'translated_plural_2',
					],
				},
				'test_domain'
			);

			expect( locale._n( 'singular', 'plural', 1, 'test_domain' ) ).toBe(
				'translated'
			);
			expect( locale._n( 'singular', 'plural', 2, 'test_domain' ) ).toBe(
				'translated_plural_1'
			);
			expect( locale._n( 'singular', 'plural', 3, 'test_domain' ) ).toBe(
				'translated_plural_1'
			);
		} );
	} );
} );

describe( 'i18n filters', () => {
	function createHooksWithI18nFilters() {
		const hooks = createHooks();
		hooks.addFilter(
			'i18n.gettext',
			'test',
			( translation ) => translation + '/i18n.gettext'
		);
		hooks.addFilter(
			'i18n.gettext_default',
			'test',
			( translation ) => translation + '/i18n.gettext_default'
		);
		hooks.addFilter(
			'i18n.gettext_domain',
			'test',
			( translation ) => translation + '/i18n.gettext_domain'
		);

		hooks.addFilter(
			'i18n.ngettext',
			'test',
			( translation ) => translation + '/i18n.ngettext'
		);
		hooks.addFilter(
			'i18n.ngettext_default',
			'test',
			( translation ) => translation + '/i18n.ngettext_default'
		);
		hooks.addFilter(
			'i18n.ngettext_domain',
			'test',
			( translation ) => translation + '/i18n.ngettext_domain'
		);

		hooks.addFilter(
			'i18n.gettext_with_context',
			'test',
			( translation, text, context ) =>
				translation + `/i18n.gettext_with_${ context }`
		);
		hooks.addFilter(
			'i18n.gettext_with_context_default',
			'test',
			( translation, text, context ) =>
				translation + `/i18n.gettext_with_${ context }_default`
		);
		hooks.addFilter(
			'i18n.gettext_with_context_domain',
			'test',
			( translation, text, context ) =>
				translation + `/i18n.gettext_with_${ context }_domain`
		);

		hooks.addFilter(
			'i18n.ngettext_with_context',
			'test',
			( translation, single, plural, number, context ) =>
				translation + `/i18n.ngettext_with_${ context }`
		);
		hooks.addFilter(
			'i18n.ngettext_with_context_default',
			'test',
			( translation, single, plural, number, context ) =>
				translation + `/i18n.ngettext_with_${ context }_default`
		);
		hooks.addFilter(
			'i18n.ngettext_with_context_domain',
			'test',
			( translation, single, plural, number, context ) =>
				translation + `/i18n.ngettext_with_${ context }_domain`
		);
		hooks.addFilter(
			'i18n.has_translation',
			'test',
			( hasTranslation, single, context, domain ) => {
				if (
					single === 'Always' &&
					! context &&
					( domain ?? 'default' ) === 'default'
				) {
					return true;
				}

				return hasTranslation;
			}
		);
		return hooks;
	}

	test( '__() calls filters', () => {
		const hooks = createHooksWithI18nFilters();
		const i18n = createI18n( undefined, undefined, hooks );

		expect( i18n.__( 'hello' ) ).toEqual(
			'hello/i18n.gettext/i18n.gettext_default'
		);
		expect( i18n.__( 'hello', 'domain' ) ).toEqual(
			'hello/i18n.gettext/i18n.gettext_domain'
		);
	} );

	test( '_x() calls filters', () => {
		const hooks = createHooksWithI18nFilters();
		const i18n = createI18n( undefined, undefined, hooks );

		expect( i18n._x( 'hello', 'ctx' ) ).toEqual(
			'hello/i18n.gettext_with_ctx/i18n.gettext_with_ctx_default'
		);
		expect( i18n._x( 'hello', 'ctx', 'domain' ) ).toEqual(
			'hello/i18n.gettext_with_ctx/i18n.gettext_with_ctx_domain'
		);
	} );

	test( '_n() calls filters', () => {
		const hooks = createHooksWithI18nFilters();
		const i18n = createI18n( undefined, undefined, hooks );

		expect( i18n._n( 'hello', 'hellos', 1 ) ).toEqual(
			'hello/i18n.ngettext/i18n.ngettext_default'
		);
		expect( i18n._n( 'hello', 'hellos', 1, 'domain' ) ).toEqual(
			'hello/i18n.ngettext/i18n.ngettext_domain'
		);
		expect( i18n._n( 'hello', 'hellos', 2 ) ).toEqual(
			'hellos/i18n.ngettext/i18n.ngettext_default'
		);
		expect( i18n._n( 'hello', 'hellos', 2, 'domain' ) ).toEqual(
			'hellos/i18n.ngettext/i18n.ngettext_domain'
		);
	} );

	test( '_nx() calls filters', () => {
		const hooks = createHooksWithI18nFilters();
		const i18n = createI18n( undefined, undefined, hooks );

		expect( i18n._nx( 'hello', 'hellos', 1, 'ctx' ) ).toEqual(
			'hello/i18n.ngettext_with_ctx/i18n.ngettext_with_ctx_default'
		);
		expect( i18n._nx( 'hello', 'hellos', 1, 'ctx', 'domain' ) ).toEqual(
			'hello/i18n.ngettext_with_ctx/i18n.ngettext_with_ctx_domain'
		);
		expect( i18n._nx( 'hello', 'hellos', 2, 'ctx' ) ).toEqual(
			'hellos/i18n.ngettext_with_ctx/i18n.ngettext_with_ctx_default'
		);
		expect( i18n._nx( 'hello', 'hellos', 2, 'ctx', 'domain' ) ).toEqual(
			'hellos/i18n.ngettext_with_ctx/i18n.ngettext_with_ctx_domain'
		);
	} );

	test( 'hasTranslation() calls filters', () => {
		const hooks = createHooksWithI18nFilters();
		const { hasTranslation } = createI18n( frenchLocale, undefined, hooks );

		expect( hasTranslation( 'hello' ) ).toBe( true );
		expect( hasTranslation( 'hello', 'not a greeting' ) ).toBe( false );
		expect( hasTranslation( 'Always' ) ).toBe( true );
		expect( hasTranslation( 'Always', 'other context' ) ).toBe( false );
		expect( hasTranslation( 'Always', undefined, 'domain' ) ).toBe( false );
	} );
} );

/* eslint-enable @wordpress/i18n-text-domain, @wordpress/i18n-translator-comments */
