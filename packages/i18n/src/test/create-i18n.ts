/* eslint-disable @wordpress/i18n-text-domain, @wordpress/i18n-translator-comments */
import { createHooks } from '@wordpress/hooks';
import { createI18n } from '..';
import type { I18nDomainMetadata, LocaleData } from '../types';

type AllowedTextDomain = 'test_domain' | 'test_domain2';

const strayaLocale: LocaleData = {
	hello: [ 'gday', '' ],
};

const frenchLocale: LocaleData = {
	hello: [ 'bonjour', '' ],
};

const localeData: LocaleData< AllowedTextDomain > = {
	'': {
		// Domain name.
		domain: 'test_domain',
		lang: 'fr',
		// Plural form function for language.
		plural_forms: 'nplurals=2; plural=(n != 1);',
	},

	hello: [ 'bonjour', '' ],

	'verb\u0004feed': [ 'nourrir', '' ],

	'hello %s': [ 'bonjour %s', '' ],

	'%d banana': [ '%d banane', '%d bananes' ],

	'fruit\u0004%d apple': [ '%d pomme', '%d pommes' ],
};

const additionalLocaleData: LocaleData< AllowedTextDomain > = {
	cheeseburger: [ 'hamburger au fromage', '' ],
	'%d cat': [ '%d chat', '%d chats' ],
};

const createTestLocale = () =>
	createI18n< AllowedTextDomain >( localeData, 'test_domain' );

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
		const ARLocaleData: LocaleData = {
			'': {
				plural_forms:
					'nplurals=6; plural=n==0 ? 0 : n==1 ? 1 : n==2 ? 2 : n%100>=3 && n%100<=10 ? 3 : n%100>=11 && n%100<=99 ? 4 : 5;',
				lang: 'ar',
			},
			'text direction\u0004ltr': [ 'rtl', '' ],
			Back: [ 'رجوع', '' ],
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
			const locale = createI18n< 'test_domain' | 'test_domain2' >(
				localeData,
				'test_domain'
			);
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

			const domainMeta = locale.getLocaleData( domain )[ '' ];
			expect(
				typeof domainMeta === 'object' && ! Array.isArray( domainMeta )
					? domainMeta.domain
					: undefined
			).toBeUndefined();
			expect(
				typeof domainMeta === 'object' && ! Array.isArray( domainMeta )
					? domainMeta.lang
					: undefined
			).toBeUndefined();
			expect(
				typeof domainMeta === 'object' && ! Array.isArray( domainMeta )
					? domainMeta.additionalData
					: undefined
			).toBe( domainConfiguration.additionalData );
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
			const locale = createI18n< 'test_domain' | 'test_domain2' >(
				localeData,
				'test_domain'
			);
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

			expect(
				(
					locale.getLocaleData( domain )[
						''
					] as I18nDomainMetadata< 'test_domain' >
				 ).domain
			).toBe( domain );
			expect(
				(
					locale.getLocaleData( domain )[
						''
					] as I18nDomainMetadata< 'test_domain' >
				 ).lang
			).toBe( 'fr' );
			expect(
				(
					locale.getLocaleData( domain )[
						''
					] as I18nDomainMetadata< 'test_domain' >
				 ).additionalData
			).toBe( domainConfiguration.additionalData );
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

			// Reset the locale data and fallback to the default plural forms function.
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

	describe( 'numberFormatI18n', () => {
		// Normal execution - basic functionality with English locale
		test( 'normal execution', () => {
			const locale = createI18n();
			expect( locale.numberFormatI18n( 1000 ) ).toBe( '1,000' );
			expect( locale.numberFormatI18n( 1234.56, 2 ) ).toBe( '1,234.56' );
			expect( locale.numberFormatI18n( -42.5, 1 ) ).toBe( '-42.5' );
			expect( locale.numberFormatI18n( 0 ) ).toBe( '0' );
			expect( locale.numberFormatI18n( Infinity ) ).toBe( '∞' );
			expect( locale.numberFormatI18n( NaN ) ).toBe( 'NaN' );
			// Test decimal clamping
			expect( locale.numberFormatI18n( 1234.5678, -1 ) ).toBe( '1,235' );
			expect( locale.numberFormatI18n( 1234.5, 25 ) ).toBe(
				'1,234.50000000000000000000'
			);
		} );

		// Some language locale specific execution - representative locales
		test( 'some language locale specific execution', () => {
			// French locale
			const frenchI18n = createI18n( {
				'': {
					lang: 'fr_FR',
					plural_forms: 'nplurals=2; plural=(n != 1);',
				},
			} );
			expect( frenchI18n.numberFormatI18n( 1234.56, 2 ) ).toBe(
				'1\u202f234,56'
			);

			// German locale
			const germanI18n = createI18n( {
				'': {
					lang: 'de_DE',
					plural_forms: 'nplurals=2; plural=(n != 1);',
				},
			} );
			expect( germanI18n.numberFormatI18n( 1234.56, 2 ) ).toBe(
				'1.234,56'
			);

			// Spanish locale
			const spanishI18n = createI18n( {
				'': {
					lang: 'es_ES',
					plural_forms: 'nplurals=2; plural=(n != 1);',
				},
			} );
			expect( spanishI18n.numberFormatI18n( 1234.56, 2 ) ).toBe(
				'1234,56'
			);

			// Japanese locale
			const japaneseLocale = createI18n( {
				'': { lang: 'ja', plural_forms: 'nplurals=1; plural=0;' },
			} );
			expect( japaneseLocale.numberFormatI18n( 1234.56, 2 ) ).toBe(
				'1,234.56'
			);
		} );

		// Special language locale specific execution - WordPress specific and edge cases
		test( 'special language locale specific execution', () => {
			// German formal variant
			const germanFormalLocale = createI18n( {
				'': {
					lang: 'de_DE_formal',
					plural_forms: 'nplurals=2; plural=(n != 1);',
				},
			} );
			expect( germanFormalLocale.numberFormatI18n( 1234.56, 2 ) ).toBe(
				'1.234,56'
			);

			// Complex Chinese locale
			const chineseI18n = createI18n( {
				'': {
					lang: 'zh_Hans_CN',
					plural_forms: 'nplurals=1; plural=0;',
				},
			} );
			expect( chineseI18n.numberFormatI18n( 1234.56, 2 ) ).toBe(
				'1,234.56'
			);

			// Japanese locale
			const japaneseI18n = createI18n( {
				'': {
					lang: 'ja',
					plural_forms: 'nplurals=1; plural=0;',
				},
			} );
			expect( japaneseI18n.numberFormatI18n( 1234.56, 2 ) ).toBe(
				'1,234.56'
			);

			// Portuguese AO90 variant
			const portugueseAO90Locale = createI18n( {
				'': {
					lang: 'pt_PT_ao90',
					plural_forms: 'nplurals=2; plural=(n != 1);',
				},
			} );
			// Falls back to en-US since pt-PT-ao90 is not supported by Intl
			expect( portugueseAO90Locale.numberFormatI18n( 1234.56, 2 ) ).toBe(
				'1,234.56'
			);

			// Test domain-specific locale
			const locale = createI18n();
			locale.setLocaleData(
				{
					'': {
						lang: 'fr_CA',
						plural_forms: 'nplurals=2; plural=(n != 1);',
					},
				},
				'custom_domain'
			);
			expect(
				locale.numberFormatI18n( 1234.56, 2, 'custom_domain' )
			).toBe( '1\u00a0234,56' );
		} );

		// Fallback checks - invalid locales and missing data
		test( 'fallback checks', () => {
			// Invalid locale format
			const invalidLocale = createI18n( {
				'': {
					lang: 'invalid_locale',
					plural_forms: 'nplurals=2; plural=(n != 1);',
				},
			} );
			expect( invalidLocale.numberFormatI18n( 1234.56, 2 ) ).toBe(
				'1,234.56'
			);

			// Missing lang property
			const missingLangLocale = createI18n( {
				'': { plural_forms: 'nplurals=2; plural=(n != 1);' },
			} );
			expect( missingLangLocale.numberFormatI18n( 1234.56, 2 ) ).toBe(
				'1,234.56'
			);

			// Empty lang property
			const emptyLangLocale = createI18n( {
				'': { lang: '', plural_forms: 'nplurals=2; plural=(n != 1);' },
			} );
			expect( emptyLangLocale.numberFormatI18n( 1234.56, 2 ) ).toBe(
				'1,234.56'
			);

			// WordPress art locales (should fallback)
			const artEmojiLocale = createI18n( {
				'': {
					lang: 'art_xemoji',
					plural_forms: 'nplurals=2; plural=(n != 1);',
				},
			} );
			expect( artEmojiLocale.numberFormatI18n( 1234.56, 2 ) ).toBe(
				'1,234.56'
			);

			// Non-existent domain
			const frenchFRLocale = createI18n( {
				'': {
					lang: 'fr_FR',
					plural_forms: 'nplurals=2; plural=(n != 1);',
				},
			} );
			expect(
				frenchFRLocale.numberFormatI18n(
					1234.56,
					2,
					'nonexistent_domain' as any
				)
			).toBe( '1,234.56' );
		} );

		// Comprehensive test for all WordPress Polyglots locales
		const polyglotLocales: Array< [ string, string ] > = [
			[ 'af', '1\u00a0234,56' ],
			[ 'am', '1,234.56' ],
			[ 'ar', '1,234.56' ],
			[ 'arg', '1,234.56' ],
			[ 'arq', '1,234.56' ],
			[ 'art_xemoji', '1,234.56' ],
			[ 'art_xpirate', '1,234.56' ],
			[ 'ary', '1,234.56' ],
			[ 'as', '১,২৩৪.৫৬' ],
			[ 'ast', '1.234,56' ],
			[ 'az', '1.234,56' ],
			[ 'az_TR', '1.234,56' ],
			[ 'azb', '1,234.56' ],
			[ 'ba', '1,234.56' ],
			[ 'bal', '1,234.56' ],
			[ 'bcc', '1,234.56' ],
			[ 'bel', '1234,56' ],
			[ 'bg_BG', '1234,56' ],
			[ 'bgn', '1,234.56' ],
			[ 'bho', '१,२३४.५६' ],
			[ 'bn_BD', '১,২৩৪.৫৬' ],
			[ 'bn_IN', '১,২৩৪.৫৬' ],
			[ 'bo', '1,234.56' ],
			[ 'bre', '1 234,56' ],
			[ 'brx', '1,234.56' ],
			[ 'bs_BA', '1.234,56' ],
			[ 'ca', '1.234,56' ],
			[ 'ca_valencia', '1.234,56' ],
			[ 'ceb', '1,234.56' ],
			[ 'ckb', '١٬٢٣٤٫٥٦' ],
			[ 'co', '1,234.56' ],
			[ 'cor', '1,234.56' ],
			[ 'cs_CZ', '1 234,56' ],
			[ 'cy', '1,234.56' ],
			[ 'da_DK', '1.234,56' ],
			[ 'de_AT', '1 234,56' ],
			[ 'de_CH', '1’234.56' ],
			[ 'de_CH_informal', '1’234.56' ],
			[ 'de_DE', '1.234,56' ],
			[ 'de_DE_formal', '1.234,56' ],
			[ 'dsb', '1.234,56' ],
			[ 'dv', '1,234.56' ],
			[ 'dzo', '༡,༢༣༤.༥༦' ],
			[ 'el', '1.234,56' ],
			[ 'en_AU', '1,234.56' ],
			[ 'en_CA', '1,234.56' ],
			[ 'en_GB', '1,234.56' ],
			[ 'en_NZ', '1,234.56' ],
			[ 'en_ZA', '1 234,56' ],
			[ 'eo', '1 234,56' ],
			[ 'es_AR', '1.234,56' ],
			[ 'es_CL', '1.234,56' ],
			[ 'es_CO', '1.234,56' ],
			[ 'es_CR', '1 234,56' ],
			[ 'es_DO', '1,234.56' ],
			[ 'es_EC', '1.234,56' ],
			[ 'es_ES', '1234,56' ],
			[ 'es_GT', '1,234.56' ],
			[ 'es_HN', '1,234.56' ],
			[ 'es_MX', '1,234.56' ],
			[ 'es_PE', '1,234.56' ],
			[ 'es_PR', '1,234.56' ],
			[ 'es_UY', '1.234,56' ],
			[ 'es_VE', '1.234,56' ],
			[ 'et', '1234,56' ],
			[ 'eu', '1.234,56' ],
			[ 'ewe', '1234.56' ],
			[ 'fa_AF', '۱٬۲۳۴٫۵۶' ],
			[ 'fa_IR', '۱٬۲۳۴٫۵۶' ],
			[ 'fi', '1 234,56' ],
			[ 'fo', '1.234,56' ],
			[ 'fon', '1,234.56' ],
			[ 'fr_BE', '1\u202f234,56' ],
			[ 'fr_CA', '1 234,56' ],
			[ 'fr_FR', '1\u202f234,56' ],
			[ 'frp', '1,234.56' ],
			[ 'fuc', '1 234,56' ],
			[ 'fur', '1.234,56' ],
			[ 'fy', '1.234,56' ],
			[ 'ga', '1,234.56' ],
			[ 'gax', '1,234.56' ],
			[ 'gd', '1,234.56' ],
			[ 'gl_ES', '1.234,56' ],
			[ 'gu', '1,234.56' ],
			[ 'hat', '1,234.56' ],
			[ 'hau', '1,234.56' ],
			[ 'haw_US', '1,234.56' ],
			[ 'haz', '1,234.56' ],
			[ 'he_IL', '1,234.56' ],
			[ 'hi_IN', '1,234.56' ],
			[ 'hr', '1.234,56' ],
			[ 'hsb', '1.234,56' ],
			[ 'hu_HU', '1234,56' ],
			[ 'hy', '1 234,56' ],
			[ 'ibo', '1,234.56' ],
			[ 'id_ID', '1.234,56' ],
			[ 'ido', '1,234.56' ],
			[ 'is_IS', '1.234,56' ],
			[ 'it_IT', '1234,56' ],
			[ 'ja', '1,234.56' ],
			[ 'jv_ID', '1.234,56' ],
			[ 'ka_GE', '1234,56' ],
			[ 'kaa', '1,234.56' ],
			[ 'kab', '1 234,56' ],
			[ 'kal', '1.234,56' ],
			[ 'kin', '1.234,56' ],
			[ 'kir', '1 234,56' ],
			[ 'kk', '1 234,56' ],
			[ 'km', '1,234.56' ],
			[ 'kmr', '1.234,56' ],
			[ 'kn', '1,234.56' ],
			[ 'ko_KR', '1,234.56' ],
			[ 'lb_LU', '1.234,56' ],
			[ 'li', '1,234.56' ],
			[ 'lij', '1.234,56' ],
			[ 'lin', '1.234,56' ],
			[ 'lmo', '1’234,56' ],
			[ 'lo', '1.234,56' ],
			[ 'lt_LT', '1 234,56' ],
			[ 'lug', '1,234.56' ],
			[ 'lv', '1234,56' ],
			[ 'mai', '1,234.56' ],
			[ 'me_ME', '1,234.56' ],
			[ 'mfe', '1 234.56' ],
			[ 'mg_MG', '1,234.56' ],
			[ 'mk_MK', '1.234,56' ],
			[ 'ml_IN', '1,234.56' ],
			[ 'mlt', '1,234.56' ],
			[ 'mn', '1,234.56' ],
			[ 'mr', '१,२३४.५६' ],
			[ 'mri', '1,234.56' ],
			[ 'ms_MY', '1,234.56' ],
			[ 'my_MM', '၁,၂၃၄.၅၆' ],
			[ 'nb_NO', '1 234,56' ],
			[ 'ne_NP', '१,२३४.५६' ],
			[ 'nl_BE', '1.234,56' ],
			[ 'nl_NL', '1.234,56' ],
			[ 'nl_NL_formal', '1.234,56' ],
			[ 'nn_NO', '1 234,56' ],
			[ 'nqo', '߁،߂߃߄.߅߆' ],
			[ 'oci', '1 234,56' ],
			[ 'ory', '1,234.56' ],
			[ 'os', '1 234,56' ],
			[ 'pa_IN', '1,234.56' ],
			[ 'pa_PK', '۱٬۲۳۴٫۵۶' ],
			[ 'pap_AW', '1,234.56' ],
			[ 'pap_CW', '1,234.56' ],
			[ 'pcd', '1,234.56' ],
			[ 'pcm', '1,234.56' ],
			[ 'pl_PL', '1234,56' ],
			[ 'ps', '۱٬۲۳۴٫۵۶' ],
			[ 'pt_AO', '1 234,56' ],
			[ 'pt_BR', '1.234,56' ],
			[ 'pt_PT', '1234,56' ],
			[ 'pt_PT_ao90', '1,234.56' ],
			[ 'rhg', '1,234.56' ],
			[ 'ro_RO', '1.234,56' ],
			[ 'roh', '1’234.56' ],
			[ 'ru_RU', '1 234,56' ],
			[ 'sa_IN', '१,२३४.५६' ],
			[ 'sah', '1 234,56' ],
			[ 'scn', '1,234.56' ],
			[ 'si_LK', '1,234.56' ],
			[ 'sk_SK', '1 234,56' ],
			[ 'skr', '1,234.56' ],
			[ 'sl_SI', '1234,56' ],
			[ 'sna', '1,234.56' ],
			[ 'snd', '١٬٢٣٤.٥٦' ],
			[ 'so_SO', '1,234.56' ],
			[ 'sq', '1234,56' ],
			[ 'sq_XK', '1234,56' ],
			[ 'sr_RS', '1.234,56' ],
			[ 'sr_RS_latin', '1.234,56' ],
			[ 'srd', '1.234,56' ],
			[ 'ssw', '1,234.56' ],
			[ 'su_ID', '1.234,56' ],
			[ 'sv_SE', '1 234,56' ],
			[ 'sw', '1,234.56' ],
			[ 'syr', '1,234.56' ],
			[ 'szl', '1 234,56' ],
			[ 'ta_IN', '1,234.56' ],
			[ 'ta_LK', '1,234.56' ],
			[ 'tah', '1,234.56' ],
			[ 'te', '1,234.56' ],
			[ 'tg', '1 234,56' ],
			[ 'th', '1,234.56' ],
			[ 'tir', '1,234.56' ],
			[ 'tl', '1,234.56' ],
			[ 'tr_TR', '1.234,56' ],
			[ 'tt_RU', '1 234,56' ],
			[ 'tuk', '1 234,56' ],
			[ 'twd', '1,234.56' ],
			[ 'tzm', '1 234,56' ],
			[ 'ug_CN', '1,234.56' ],
			[ 'uk', '1 234,56' ],
			[ 'ur', '1,234.56' ],
			[ 'uz_UZ', '1 234,56' ],
			[ 'vec', '1 234,56' ],
			[ 'vi', '1.234,56' ],
			[ 'wol', '1.234,56' ],
			[ 'xho', '1 234.56' ],
			[ 'yor', '1,234.56' ],
			[ 'zgh', '1 234,56' ],
			[ 'zh_CN', '1,234.56' ],
			[ 'zh_HK', '1,234.56' ],
			[ 'zh_SG', '1,234.56' ],
			[ 'zh_TW', '1,234.56' ],
			[ 'zul', '1,234.56' ],
		];

		describe( 'comprehensive polyglots locale coverage', () => {
			test.each( polyglotLocales )(
				'should format 1234.56 in %s locale as %s',
				( wpLocale, expectedFormat ) => {
					const locale = createI18n( {
						'': {
							lang: wpLocale,
							plural_forms: 'nplurals=2; plural=(n != 1);',
						},
					} );
					const result = locale.numberFormatI18n( 1234.56, 2 );
					expect( result ).toBe( expectedFormat );
				}
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
