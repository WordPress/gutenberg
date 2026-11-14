import { __, _x } from '@wordpress/i18n';

export interface SpecialCharacter {
	/**
	 * The character inserted into the text.
	 */
	char: string;
	/**
	 * A translated, human-readable name. It is the character's accessible
	 * name and the text that search matches against.
	 */
	name: string;
	/**
	 * What the grid shows for a character with no visible glyph, such as a
	 * space. Not translated: like a code point, it names the character
	 * itself.
	 */
	symbol?: string;
	/**
	 * Other terms search matches, such as an abbreviation.
	 */
	keywords?: string[];
}

export interface SpecialCharacterCategory {
	slug: string;
	label: string;
	characters: SpecialCharacter[];
}

/**
 * Builds the character list. It is a function, not a constant, so the names
 * are translated when the popover opens, after locale data has loaded.
 */
export function getSpecialCharacterCategories(): SpecialCharacterCategory[] {
	return [
		{
			slug: 'punctuation',
			label: __( 'Punctuation' ),
			characters: [
				{ char: '–', name: __( 'En dash' ) },
				{ char: '—', name: __( 'Em dash' ) },
				{ char: '‒', name: __( 'Figure dash' ) },
				{ char: '…', name: __( 'Ellipsis' ) },
				{ char: '•', name: __( 'Bullet' ) },
				{ char: '·', name: __( 'Middle dot' ) },
				{ char: '‘', name: __( 'Left single quotation mark' ) },
				{ char: '’', name: __( 'Right single quotation mark' ) },
				{ char: '“', name: __( 'Left double quotation mark' ) },
				{ char: '”', name: __( 'Right double quotation mark' ) },
				{ char: '‚', name: __( 'Single low quotation mark' ) },
				{ char: '„', name: __( 'Double low quotation mark' ) },
				{
					char: '‹',
					name: __( 'Single left-pointing angle quotation mark' ),
				},
				{
					char: '›',
					name: __( 'Single right-pointing angle quotation mark' ),
				},
				{
					char: '«',
					name: __( 'Left-pointing double angle quotation mark' ),
				},
				{
					char: '»',
					name: __( 'Right-pointing double angle quotation mark' ),
				},
				{ char: '′', name: __( 'Prime' ) },
				{ char: '″', name: __( 'Double prime' ) },
				{ char: '¡', name: __( 'Inverted exclamation mark' ) },
				{ char: '¿', name: __( 'Inverted question mark' ) },
				{ char: '§', name: __( 'Section sign' ) },
				{ char: '¶', name: __( 'Pilcrow sign' ) },
				{ char: '†', name: __( 'Dagger' ) },
				{ char: '‡', name: __( 'Double dagger' ) },
				{ char: '№', name: __( 'Numero sign' ) },
				{
					char: '\u00a0',
					name: __( 'Non-breaking space' ),
					symbol: 'NBSP',
					keywords: [ 'nbsp' ],
				},
			],
		},
		{
			slug: 'currency',
			label: __( 'Currency' ),
			characters: [
				{ char: '¢', name: __( 'Cent sign' ) },
				{ char: '£', name: __( 'Pound sign' ) },
				{ char: '¥', name: __( 'Yen sign' ) },
				{ char: '€', name: __( 'Euro sign' ) },
				{ char: '₹', name: __( 'Indian rupee sign' ) },
				{ char: '₽', name: __( 'Ruble sign' ) },
				{ char: '₩', name: __( 'Won sign' ) },
				{ char: '₪', name: __( 'New sheqel sign' ) },
				{ char: '₫', name: __( 'Dong sign' ) },
				{ char: '₱', name: __( 'Peso sign' ) },
				{ char: '₺', name: __( 'Turkish lira sign' ) },
				{ char: '₴', name: __( 'Hryvnia sign' ) },
				{ char: '₦', name: __( 'Naira sign' ) },
				{ char: '₿', name: __( 'Bitcoin sign' ) },
				{ char: '¤', name: __( 'Currency sign' ) },
				{ char: 'ƒ', name: __( 'Florin sign' ) },
			],
		},
		{
			slug: 'symbols',
			label: _x( 'Symbols', 'special characters category' ),
			characters: [
				{ char: '©', name: __( 'Copyright sign' ) },
				{ char: '®', name: __( 'Registered sign' ) },
				{ char: '™', name: __( 'Trade mark sign' ) },
				{ char: '℠', name: __( 'Service mark' ) },
				{ char: '℗', name: __( 'Sound recording copyright' ) },
				{ char: '°', name: __( 'Degree sign' ) },
				{ char: 'µ', name: __( 'Micro sign' ) },
				{ char: '‰', name: __( 'Per mille sign' ) },
				{ char: '★', name: __( 'Black star' ) },
				{ char: '☆', name: __( 'White star' ) },
				{ char: '✓', name: __( 'Check mark' ) },
				{ char: '✗', name: __( 'Ballot X' ) },
				{ char: '♠', name: __( 'Black spade suit' ) },
				{ char: '♣', name: __( 'Black club suit' ) },
				{ char: '♥', name: __( 'Black heart suit' ) },
				{ char: '♦', name: __( 'Black diamond suit' ) },
				{ char: '♀', name: __( 'Female sign' ) },
				{ char: '♂', name: __( 'Male sign' ) },
			],
		},
		{
			slug: 'math',
			label: _x( 'Math', 'special characters category' ),
			characters: [
				{ char: '±', name: __( 'Plus-minus sign' ) },
				{ char: '−', name: __( 'Minus sign' ) },
				{ char: '×', name: __( 'Multiplication sign' ) },
				{ char: '÷', name: __( 'Division sign' ) },
				{ char: '=', name: __( 'Equals sign' ) },
				{ char: '≠', name: __( 'Not equal to' ) },
				{ char: '≈', name: __( 'Almost equal to' ) },
				{ char: '≡', name: __( 'Identical to' ) },
				{ char: '<', name: __( 'Less-than sign' ) },
				{ char: '>', name: __( 'Greater-than sign' ) },
				{ char: '≤', name: __( 'Less-than or equal to' ) },
				{ char: '≥', name: __( 'Greater-than or equal to' ) },
				{ char: '∞', name: __( 'Infinity' ) },
				{ char: '√', name: __( 'Square root' ) },
				{ char: '∑', name: __( 'N-ary summation' ) },
				{ char: '∏', name: __( 'N-ary product' ) },
				{ char: '∫', name: __( 'Integral' ) },
				{ char: '∂', name: __( 'Partial differential' ) },
				{ char: '∆', name: __( 'Increment' ) },
				{ char: '∇', name: __( 'Nabla' ) },
				{ char: '∈', name: __( 'Element of' ) },
				{ char: '∉', name: __( 'Not an element of' ) },
				{ char: '∩', name: __( 'Intersection' ) },
				{ char: '∪', name: __( 'Union' ) },
				{ char: '⊂', name: __( 'Subset of' ) },
				{ char: '⊃', name: __( 'Superset of' ) },
				{ char: '∀', name: __( 'For all' ) },
				{ char: '∃', name: __( 'There exists' ) },
				{ char: '¬', name: __( 'Not sign' ) },
				{ char: '∠', name: __( 'Angle' ) },
				{ char: '⊥', name: __( 'Perpendicular' ) },
				{ char: '∝', name: __( 'Proportional to' ) },
				{ char: '½', name: __( 'Vulgar fraction one half' ) },
				{ char: '⅓', name: __( 'Vulgar fraction one third' ) },
				{ char: '⅔', name: __( 'Vulgar fraction two thirds' ) },
				{ char: '¼', name: __( 'Vulgar fraction one quarter' ) },
				{ char: '¾', name: __( 'Vulgar fraction three quarters' ) },
				{ char: '⅕', name: __( 'Vulgar fraction one fifth' ) },
				{ char: '⅖', name: __( 'Vulgar fraction two fifths' ) },
				{ char: '⅗', name: __( 'Vulgar fraction three fifths' ) },
				{ char: '⅘', name: __( 'Vulgar fraction four fifths' ) },
				{ char: '⅙', name: __( 'Vulgar fraction one sixth' ) },
				{ char: '⅚', name: __( 'Vulgar fraction five sixths' ) },
				{ char: '⅐', name: __( 'Vulgar fraction one seventh' ) },
				{ char: '⅛', name: __( 'Vulgar fraction one eighth' ) },
				{ char: '⅜', name: __( 'Vulgar fraction three eighths' ) },
				{ char: '⅝', name: __( 'Vulgar fraction five eighths' ) },
				{ char: '⅞', name: __( 'Vulgar fraction seven eighths' ) },
				{ char: '⅑', name: __( 'Vulgar fraction one ninth' ) },
				{ char: '⅒', name: __( 'Vulgar fraction one tenth' ) },
				{ char: '¹', name: __( 'Superscript one' ) },
				{ char: '²', name: __( 'Superscript two' ) },
				{ char: '³', name: __( 'Superscript three' ) },
			],
		},
		{
			slug: 'music',
			label: _x( 'Music', 'special characters category' ),
			characters: [
				{ char: '♩', name: __( 'Quarter note' ) },
				{ char: '♪', name: __( 'Eighth note' ) },
				{ char: '♫', name: __( 'Beamed eighth notes' ) },
				{ char: '♬', name: __( 'Beamed sixteenth notes' ) },
				{ char: '♭', name: __( 'Music flat sign' ) },
				{ char: '♮', name: __( 'Music natural sign' ) },
				{ char: '♯', name: __( 'Music sharp sign' ) },
			],
		},
		{
			slug: 'arrows',
			label: __( 'Arrows' ),
			characters: [
				{ char: '←', name: __( 'Leftwards arrow' ) },
				{ char: '↑', name: __( 'Upwards arrow' ) },
				{ char: '→', name: __( 'Rightwards arrow' ) },
				{ char: '↓', name: __( 'Downwards arrow' ) },
				{ char: '↔', name: __( 'Left right arrow' ) },
				{ char: '↕', name: __( 'Up down arrow' ) },
				{ char: '↖', name: __( 'North west arrow' ) },
				{ char: '↗', name: __( 'North east arrow' ) },
				{ char: '↘', name: __( 'South east arrow' ) },
				{ char: '↙', name: __( 'South west arrow' ) },
				{ char: '↩', name: __( 'Leftwards arrow with hook' ) },
				{ char: '↪', name: __( 'Rightwards arrow with hook' ) },
				{ char: '⇐', name: __( 'Leftwards double arrow' ) },
				{ char: '⇒', name: __( 'Rightwards double arrow' ) },
				{ char: '⇔', name: __( 'Left right double arrow' ) },
			],
		},
		{
			slug: 'latin',
			label: __( 'Latin' ),
			characters: [
				{ char: 'À', name: __( 'Latin capital letter A with grave' ) },
				{ char: 'Á', name: __( 'Latin capital letter A with acute' ) },
				{
					char: 'Â',
					name: __( 'Latin capital letter A with circumflex' ),
				},
				{ char: 'Ã', name: __( 'Latin capital letter A with tilde' ) },
				{
					char: 'Ä',
					name: __( 'Latin capital letter A with diaeresis' ),
				},
				{
					char: 'Å',
					name: __( 'Latin capital letter A with ring above' ),
				},
				{ char: 'Æ', name: __( 'Latin capital letter AE' ) },
				{
					char: 'Ç',
					name: __( 'Latin capital letter C with cedilla' ),
				},
				{ char: 'Ć', name: __( 'Latin capital letter C with acute' ) },
				{
					char: 'Ḉ',
					name: __( 'Latin capital letter C with cedilla and acute' ),
				},
				{ char: 'È', name: __( 'Latin capital letter E with grave' ) },
				{ char: 'É', name: __( 'Latin capital letter E with acute' ) },
				{
					char: 'Ê',
					name: __( 'Latin capital letter E with circumflex' ),
				},
				{
					char: 'Ë',
					name: __( 'Latin capital letter E with diaeresis' ),
				},
				{ char: 'Ì', name: __( 'Latin capital letter I with grave' ) },
				{ char: 'Í', name: __( 'Latin capital letter I with acute' ) },
				{
					char: 'Î',
					name: __( 'Latin capital letter I with circumflex' ),
				},
				{
					char: 'Ï',
					name: __( 'Latin capital letter I with diaeresis' ),
				},
				{ char: 'Ñ', name: __( 'Latin capital letter N with tilde' ) },
				{ char: 'Ò', name: __( 'Latin capital letter O with grave' ) },
				{ char: 'Ó', name: __( 'Latin capital letter O with acute' ) },
				{
					char: 'Ô',
					name: __( 'Latin capital letter O with circumflex' ),
				},
				{ char: 'Õ', name: __( 'Latin capital letter O with tilde' ) },
				{
					char: 'Ö',
					name: __( 'Latin capital letter O with diaeresis' ),
				},
				{ char: 'Ø', name: __( 'Latin capital letter O with stroke' ) },
				{ char: 'Œ', name: __( 'Latin capital ligature OE' ) },
				{ char: 'Ù', name: __( 'Latin capital letter U with grave' ) },
				{ char: 'Ú', name: __( 'Latin capital letter U with acute' ) },
				{
					char: 'Û',
					name: __( 'Latin capital letter U with circumflex' ),
				},
				{
					char: 'Ü',
					name: __( 'Latin capital letter U with diaeresis' ),
				},
				{ char: 'Ý', name: __( 'Latin capital letter Y with acute' ) },
				{ char: 'ẞ', name: __( 'Latin capital letter sharp s' ) },
				{ char: 'à', name: __( 'Latin small letter a with grave' ) },
				{ char: 'á', name: __( 'Latin small letter a with acute' ) },
				{
					char: 'â',
					name: __( 'Latin small letter a with circumflex' ),
				},
				{ char: 'ã', name: __( 'Latin small letter a with tilde' ) },
				{
					char: 'ä',
					name: __( 'Latin small letter a with diaeresis' ),
				},
				{
					char: 'å',
					name: __( 'Latin small letter a with ring above' ),
				},
				{ char: 'æ', name: __( 'Latin small letter ae' ) },
				{ char: 'ç', name: __( 'Latin small letter c with cedilla' ) },
				{ char: 'ć', name: __( 'Latin small letter c with acute' ) },
				{
					char: 'ḉ',
					name: __( 'Latin small letter c with cedilla and acute' ),
				},
				{ char: 'è', name: __( 'Latin small letter e with grave' ) },
				{ char: 'é', name: __( 'Latin small letter e with acute' ) },
				{
					char: 'ê',
					name: __( 'Latin small letter e with circumflex' ),
				},
				{
					char: 'ë',
					name: __( 'Latin small letter e with diaeresis' ),
				},
				{ char: 'ì', name: __( 'Latin small letter i with grave' ) },
				{ char: 'í', name: __( 'Latin small letter i with acute' ) },
				{
					char: 'î',
					name: __( 'Latin small letter i with circumflex' ),
				},
				{
					char: 'ï',
					name: __( 'Latin small letter i with diaeresis' ),
				},
				{ char: 'ñ', name: __( 'Latin small letter n with tilde' ) },
				{ char: 'ò', name: __( 'Latin small letter o with grave' ) },
				{ char: 'ó', name: __( 'Latin small letter o with acute' ) },
				{
					char: 'ô',
					name: __( 'Latin small letter o with circumflex' ),
				},
				{ char: 'õ', name: __( 'Latin small letter o with tilde' ) },
				{
					char: 'ö',
					name: __( 'Latin small letter o with diaeresis' ),
				},
				{ char: 'ø', name: __( 'Latin small letter o with stroke' ) },
				{ char: 'œ', name: __( 'Latin small ligature oe' ) },
				{ char: 'ù', name: __( 'Latin small letter u with grave' ) },
				{ char: 'ú', name: __( 'Latin small letter u with acute' ) },
				{
					char: 'û',
					name: __( 'Latin small letter u with circumflex' ),
				},
				{
					char: 'ü',
					name: __( 'Latin small letter u with diaeresis' ),
				},
				{ char: 'ý', name: __( 'Latin small letter y with acute' ) },
				{
					char: 'ÿ',
					name: __( 'Latin small letter y with diaeresis' ),
				},
				{ char: 'ß', name: __( 'Latin small letter sharp s' ) },
			],
		},
		{
			slug: 'greek',
			label: __( 'Greek' ),
			characters: [
				{ char: 'Α', name: __( 'Greek capital letter alpha' ) },
				{ char: 'Β', name: __( 'Greek capital letter beta' ) },
				{ char: 'Γ', name: __( 'Greek capital letter gamma' ) },
				{ char: 'Δ', name: __( 'Greek capital letter delta' ) },
				{ char: 'Θ', name: __( 'Greek capital letter theta' ) },
				{ char: 'Λ', name: __( 'Greek capital letter lambda' ) },
				{ char: 'Π', name: __( 'Greek capital letter pi' ) },
				{ char: 'Σ', name: __( 'Greek capital letter sigma' ) },
				{ char: 'Φ', name: __( 'Greek capital letter phi' ) },
				{ char: 'Ψ', name: __( 'Greek capital letter psi' ) },
				{ char: 'Ω', name: __( 'Greek capital letter omega' ) },
				{ char: 'α', name: __( 'Greek small letter alpha' ) },
				{ char: 'β', name: __( 'Greek small letter beta' ) },
				{ char: 'γ', name: __( 'Greek small letter gamma' ) },
				{ char: 'δ', name: __( 'Greek small letter delta' ) },
				{ char: 'ε', name: __( 'Greek small letter epsilon' ) },
				{ char: 'θ', name: __( 'Greek small letter theta' ) },
				{ char: 'λ', name: __( 'Greek small letter lambda' ) },
				{ char: 'μ', name: __( 'Greek small letter mu' ) },
				{ char: 'π', name: __( 'Greek small letter pi' ) },
				{ char: 'σ', name: __( 'Greek small letter sigma' ) },
				{ char: 'τ', name: __( 'Greek small letter tau' ) },
				{ char: 'φ', name: __( 'Greek small letter phi' ) },
				{ char: 'ψ', name: __( 'Greek small letter psi' ) },
				{ char: 'ω', name: __( 'Greek small letter omega' ) },
			],
		},
	];
}

/**
 * Normalises text for search: lower case, with diacritics removed so that
 * typing "e" also finds a name written "é" in a translation.
 *
 * @param text Text to normalise.
 * @return The normalised text.
 */
function normalize( text: string ): string {
	return text.normalize( 'NFD' ).replace( /[̀-ͯ]/g, '' ).toLowerCase();
}

/**
 * Finds the characters whose name and keywords contain every word of the
 * search, or which are the searched character itself.
 *
 * @param categories The categories to search.
 * @param search     The search text.
 * @return The matching characters, in category order, without duplicates.
 */
export function searchSpecialCharacters(
	categories: SpecialCharacterCategory[],
	search: string
): SpecialCharacter[] {
	const trimmed = search.trim();
	if ( ! trimmed ) {
		return [];
	}
	const words = normalize( trimmed ).split( /\s+/ );
	const seen = new Set< string >();
	const results: SpecialCharacter[] = [];
	for ( const category of categories ) {
		for ( const character of category.characters ) {
			if ( seen.has( character.char ) ) {
				continue;
			}
			const terms = normalize(
				[ character.name, ...( character.keywords ?? [] ) ].join( ' ' )
			);
			if (
				character.char === trimmed ||
				words.every( ( word ) => terms.includes( word ) )
			) {
				seen.add( character.char );
				results.push( character );
			}
		}
	}
	return results;
}
