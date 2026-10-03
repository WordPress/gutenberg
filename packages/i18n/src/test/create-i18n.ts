/* eslint-disable @wordpress/i18n-text-domain, @wordpress/i18n-translator-comments */

import { describe, expect, it, test } from 'vitest';
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

		// Map every WordPress Polyglots locale to the BCP 47 tag it should
		// format with. Compare against `Intl.NumberFormat` for that tag rather
		// than a hardcoded string: separators come from the CLDR data bundled
		// with the runtime, which differs between Node.js versions.
		const polyglotLocales: Array< [ string, string ] > = [
			[ 'af', 'af' ],
			[ 'am', 'am' ],
			[ 'ar', 'ar' ],
			[ 'arg', 'arg' ],
			[ 'arq', 'arq' ],
			[ 'art_xemoji', 'art-xemoji' ],
			[ 'art_xpirate', 'art-xpirate' ],
			[ 'ary', 'ary' ],
			[ 'as', 'as' ],
			[ 'ast', 'ast' ],
			[ 'az', 'az' ],
			[ 'az_TR', 'az-TR' ],
			[ 'azb', 'azb' ],
			[ 'ba', 'ba' ],
			[ 'bal', 'bal' ],
			[ 'bcc', 'bcc' ],
			[ 'bel', 'bel' ],
			[ 'bg_BG', 'bg-BG' ],
			[ 'bgn', 'bgn' ],
			[ 'bho', 'bho' ],
			[ 'bn_BD', 'bn-BD' ],
			[ 'bn_IN', 'bn-IN' ],
			[ 'bo', 'bo' ],
			[ 'bre', 'bre' ],
			[ 'brx', 'brx' ],
			[ 'bs_BA', 'bs-BA' ],
			[ 'ca', 'ca' ],
			[ 'ca_valencia', 'ca-valencia' ],
			[ 'ceb', 'ceb' ],
			[ 'ckb', 'ckb' ],
			[ 'co', 'co' ],
			[ 'cor', 'cor' ],
			[ 'cs_CZ', 'cs-CZ' ],
			[ 'cy', 'cy' ],
			[ 'da_DK', 'da-DK' ],
			[ 'de_AT', 'de-AT' ],
			[ 'de_CH', 'de-CH' ],
			[ 'de_CH_informal', 'de-CH-informal' ],
			[ 'de_DE', 'de-DE' ],
			[ 'de_DE_formal', 'de-DE-formal' ],
			[ 'dsb', 'dsb' ],
			[ 'dv', 'dv' ],
			[ 'dzo', 'dzo' ],
			[ 'el', 'el' ],
			[ 'en_AU', 'en-AU' ],
			[ 'en_CA', 'en-CA' ],
			[ 'en_GB', 'en-GB' ],
			[ 'en_NZ', 'en-NZ' ],
			[ 'en_ZA', 'en-ZA' ],
			[ 'eo', 'eo' ],
			[ 'es_AR', 'es-AR' ],
			[ 'es_CL', 'es-CL' ],
			[ 'es_CO', 'es-CO' ],
			[ 'es_CR', 'es-CR' ],
			[ 'es_DO', 'es-DO' ],
			[ 'es_EC', 'es-EC' ],
			[ 'es_ES', 'es-ES' ],
			[ 'es_GT', 'es-GT' ],
			[ 'es_HN', 'es-HN' ],
			[ 'es_MX', 'es-MX' ],
			[ 'es_PE', 'es-PE' ],
			[ 'es_PR', 'es-PR' ],
			[ 'es_UY', 'es-UY' ],
			[ 'es_VE', 'es-VE' ],
			[ 'et', 'et' ],
			[ 'eu', 'eu' ],
			[ 'ewe', 'ewe' ],
			[ 'fa_AF', 'fa-AF' ],
			[ 'fa_IR', 'fa-IR' ],
			[ 'fi', 'fi' ],
			[ 'fo', 'fo' ],
			[ 'fon', 'fon' ],
			[ 'fr_BE', 'fr-BE' ],
			[ 'fr_CA', 'fr-CA' ],
			[ 'fr_FR', 'fr-FR' ],
			[ 'frp', 'frp' ],
			[ 'fuc', 'fuc' ],
			[ 'fur', 'fur' ],
			[ 'fy', 'fy' ],
			[ 'ga', 'ga' ],
			[ 'gax', 'gax' ],
			[ 'gd', 'gd' ],
			[ 'gl_ES', 'gl-ES' ],
			[ 'gu', 'gu' ],
			[ 'hat', 'hat' ],
			[ 'hau', 'hau' ],
			[ 'haw_US', 'haw-US' ],
			[ 'haz', 'haz' ],
			[ 'he_IL', 'he-IL' ],
			[ 'hi_IN', 'hi-IN' ],
			[ 'hr', 'hr' ],
			[ 'hsb', 'hsb' ],
			[ 'hu_HU', 'hu-HU' ],
			[ 'hy', 'hy' ],
			[ 'ibo', 'ibo' ],
			[ 'id_ID', 'id-ID' ],
			[ 'ido', 'ido' ],
			[ 'is_IS', 'is-IS' ],
			[ 'it_IT', 'it-IT' ],
			[ 'ja', 'ja' ],
			[ 'jv_ID', 'jv-ID' ],
			[ 'ka_GE', 'ka-GE' ],
			[ 'kaa', 'kaa' ],
			[ 'kab', 'kab' ],
			[ 'kal', 'kal' ],
			[ 'kin', 'kin' ],
			[ 'kir', 'kir' ],
			[ 'kk', 'kk' ],
			[ 'km', 'km' ],
			[ 'kmr', 'kmr' ],
			[ 'kn', 'kn' ],
			[ 'ko_KR', 'ko-KR' ],
			[ 'lb_LU', 'lb-LU' ],
			[ 'li', 'li' ],
			[ 'lij', 'lij' ],
			[ 'lin', 'lin' ],
			[ 'lmo', 'lmo' ],
			[ 'lo', 'lo' ],
			[ 'lt_LT', 'lt-LT' ],
			[ 'lug', 'lug' ],
			[ 'lv', 'lv' ],
			[ 'mai', 'mai' ],
			[ 'me_ME', 'me-ME' ],
			[ 'mfe', 'mfe' ],
			[ 'mg_MG', 'mg-MG' ],
			[ 'mk_MK', 'mk-MK' ],
			[ 'ml_IN', 'ml-IN' ],
			[ 'mlt', 'mlt' ],
			[ 'mn', 'mn' ],
			[ 'mr', 'mr' ],
			[ 'mri', 'mri' ],
			[ 'ms_MY', 'ms-MY' ],
			[ 'my_MM', 'my-MM' ],
			[ 'nb_NO', 'nb-NO' ],
			[ 'ne_NP', 'ne-NP' ],
			[ 'nl_BE', 'nl-BE' ],
			[ 'nl_NL', 'nl-NL' ],
			[ 'nl_NL_formal', 'nl-NL-formal' ],
			[ 'nn_NO', 'nn-NO' ],
			[ 'nqo', 'nqo' ],
			[ 'oci', 'oci' ],
			[ 'ory', 'ory' ],
			[ 'os', 'os' ],
			[ 'pa_IN', 'pa-IN' ],
			[ 'pa_PK', 'pa-PK' ],
			[ 'pap_AW', 'pap-AW' ],
			[ 'pap_CW', 'pap-CW' ],
			[ 'pcd', 'pcd' ],
			[ 'pcm', 'pcm' ],
			[ 'pl_PL', 'pl-PL' ],
			[ 'ps', 'ps' ],
			[ 'pt_AO', 'pt-AO' ],
			[ 'pt_BR', 'pt-BR' ],
			[ 'pt_PT', 'pt-PT' ],
			[ 'pt_PT_ao90', 'en-US' ],
			[ 'rhg', 'rhg' ],
			[ 'ro_RO', 'ro-RO' ],
			[ 'roh', 'roh' ],
			[ 'ru_RU', 'ru-RU' ],
			[ 'sa_IN', 'sa-IN' ],
			[ 'sah', 'sah' ],
			[ 'scn', 'scn' ],
			[ 'si_LK', 'si-LK' ],
			[ 'sk_SK', 'sk-SK' ],
			[ 'skr', 'skr' ],
			[ 'sl_SI', 'sl-SI' ],
			[ 'sna', 'sna' ],
			[ 'snd', 'snd' ],
			[ 'so_SO', 'so-SO' ],
			[ 'sq', 'sq' ],
			[ 'sq_XK', 'sq-XK' ],
			[ 'sr_RS', 'sr-RS' ],
			[ 'sr_RS_latin', 'sr-RS-latin' ],
			[ 'srd', 'srd' ],
			[ 'ssw', 'ssw' ],
			[ 'su_ID', 'su-ID' ],
			[ 'sv_SE', 'sv-SE' ],
			[ 'sw', 'sw' ],
			[ 'syr', 'syr' ],
			[ 'szl', 'szl' ],
			[ 'ta_IN', 'ta-IN' ],
			[ 'ta_LK', 'ta-LK' ],
			[ 'tah', 'tah' ],
			[ 'te', 'te' ],
			[ 'tg', 'tg' ],
			[ 'th', 'th' ],
			[ 'tir', 'tir' ],
			[ 'tl', 'tl' ],
			[ 'tr_TR', 'tr-TR' ],
			[ 'tt_RU', 'tt-RU' ],
			[ 'tuk', 'tuk' ],
			[ 'twd', 'twd' ],
			[ 'tzm', 'tzm' ],
			[ 'ug_CN', 'ug-CN' ],
			[ 'uk', 'uk' ],
			[ 'ur', 'ur' ],
			[ 'uz_UZ', 'uz-UZ' ],
			[ 'vec', 'vec' ],
			[ 'vi', 'vi' ],
			[ 'wol', 'wol' ],
			[ 'xho', 'xho' ],
			[ 'yor', 'yor' ],
			[ 'zgh', 'zgh' ],
			[ 'zh_CN', 'zh-CN' ],
			[ 'zh_HK', 'zh-HK' ],
			[ 'zh_SG', 'zh-SG' ],
			[ 'zh_TW', 'zh-TW' ],
			[ 'zul', 'zul' ],
		];

		describe( 'comprehensive polyglots locale coverage', () => {
			test.each( polyglotLocales )(
				'should format 1234.56 in %s locale as %s',
				( wpLocale, expectedTag ) => {
					const locale = createI18n( {
						'': {
							lang: wpLocale,
							plural_forms: 'nplurals=2; plural=(n != 1);',
						},
					} );
					const result = locale.numberFormatI18n( 1234.56, 2 );
					expect( result ).toBe(
						new Intl.NumberFormat( expectedTag, {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
						} ).format( 1234.56 )
					);
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
