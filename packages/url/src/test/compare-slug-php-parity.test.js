/**
 * Comparison script: cleanForSlug( string, locale ) vs PHP sanitize_title()
 *
 * Run with: npm run test:unit packages/url/src/test/compare-slug-php-parity.test.js
 *
 * PHP results were generated with:
 *   npm run wp-env run cli -- wp eval \
 *     'foreach($cases as [$l,$i]){echo sanitize_title_with_dashes(remove_accents($i,$l))."\n";}'
 */
import { cleanForSlug } from '../clean-for-slug';

const cases = [
	// German — de_DE
	{
		locale: 'de_DE',
		input: 'Künstler überraschen Hörer',
		php: 'kuenstler-ueberraschen-hoerer',
	},
	{
		locale: 'de_DE',
		input: 'Straße und Öffentlichkeit',
		php: 'strasse-und-oeffentlichkeit',
	},
	{
		locale: 'de_DE',
		input: 'Ärger mit Übergängen',
		php: 'aerger-mit-uebergaengen',
	},
	// German — capital Eszett (ẞ, U+1E9E), standardized in 2017 (DIN 5008)
	{ locale: 'de_DE', input: 'STRAẞE', php: 'strasse' },
	// German variants — same digraph rules apply
	{ locale: 'de_CH', input: 'Zürich Straße', php: 'zuerich-strasse' },
	{ locale: 'de_AT', input: 'Österreich', php: 'oesterreich' },
	// Danish
	{ locale: 'da_DK', input: 'Æble Ødemark Åre', php: 'aeble-oedemark-aare' },
	// Catalan
	{ locale: 'ca', input: 'col·legi', php: 'collegi' },
	// Serbian / Bosnian
	{ locale: 'sr_RS', input: 'Đorđe', php: 'djordje' },
	{ locale: 'bs_BA', input: 'Đakovo', php: 'djakovo' },
	// No locale — generic diacritic stripping only (ä → a, not ae)
	{ locale: '', input: 'Künstler', php: 'kunstler' },
];

describe( 'cleanForSlug() matches PHP sanitize_title() for locale-specific digraphs', () => {
	test.each( cases )(
		'[$locale] "$input" → "$php"',
		( { locale, input, php } ) => {
			expect( cleanForSlug( input, locale ) ).toBe( php );
		}
	);
} );
