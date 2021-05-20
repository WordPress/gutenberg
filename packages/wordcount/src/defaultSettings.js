/** @typedef {import('./index').WPWordCountStrategy} WPWordCountStrategy */

/** @typedef {Partial<{type: WPWordCountStrategy, shortcodes: string[]}>} WPWordCountL10n */

/**
 * @typedef WPWordCountSettingsFields
 * @property {RegExp}              HTMLRegExp                        Regular expression that matches HTML tags
 * @property {RegExp}              HTMLcommentRegExp                 Regular expression that matches HTML comments
 * @property {RegExp}              spaceRegExp                       Regular expression that matches spaces in HTML
 * @property {RegExp}              HTMLEntityRegExp                  Regular expression that matches HTML entities
 * @property {RegExp}              connectorRegExp                   Regular expression that matches word connectors, like em-dash
 * @property {RegExp}              removeRegExp                      Regular expression that matches various characters to be removed when counting
 * @property {RegExp}              astralRegExp                      Regular expression that matches astral UTF-16 code points
 * @property {RegExp}              wordsRegExp                       Regular expression that matches words
 * @property {RegExp}              characters_excluding_spacesRegExp Regular expression that matches characters excluding spaces
 * @property {RegExp}              characters_including_spacesRegExp Regular expression that matches characters including spaces
 * @property {RegExp}              shortcodesRegExp                  Regular expression that matches WordPress shortcodes
 * @property {string[]}            shortcodes                        List of all shortcodes
 * @property {WPWordCountStrategy} type                              Describes what and how are we counting
 * @property {WPWordCountL10n}     l10n                              Object with human translations
 */

/**
 * Lower-level settings for word counting that can be overridden.
 *
 * @typedef {Partial<WPWordCountSettingsFields>} WPWordCountUserSettings
 */

// Disable reason: JSDoc linter doesn't seem to parse the union (`&`) correctly: https://github.com/jsdoc/jsdoc/issues/1285
/* eslint-disable jsdoc/valid-types */
/**
 * Word counting settings that include non-optional values we set if missing
 *
 * @typedef {WPWordCountUserSettings & typeof defaultSettings} WPWordCountDefaultSettings
 */
/* eslint-enable jsdoc/valid-types */

export const defaultSettings = {
	HTMLRegExp: /<\/?[a-z][^>]*?>/gi,
	HTMLcommentRegExp: /<!--[\s\S]*?-->/g,
	spaceRegExp: /&nbsp;|&#160;/gi,
	HTMLEntityRegExp: /&\S+?;/g,

	// \u2014 = em-dash
	connectorRegExp: /--|\u2014/g,

	// Characters to be removed from input text.
	removeRegExp: new RegExp(
		[
			'[',

			// Basic Latin (extract)
			'\u0021-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E',

			// Latin-1 Supplement (extract)
			'\u0080-\u00BF\u00D7\u00F7',

			/*
			 * The following range consists of:
			 * General Punctuation
			 * Superscripts and Subscripts
			 * Currency Symbols
			 * Combining Diacritical Marks for Symbols
			 * Letterlike Symbols
			 * Number Forms
			 * Arrows
			 * Mathematical Operators
			 * Miscellaneous Technical
			 * Control Pictures
			 * Optical Character Recognition
			 * Enclosed Alphanumerics
			 * Box Drawing
			 * Block Elements
			 * Geometric Shapes
			 * Miscellaneous Symbols
			 * Dingbats
			 * Miscellaneous Mathematical Symbols-A
			 * Supplemental Arrows-A
			 * Braille Patterns
			 * Supplemental Arrows-B
			 * Miscellaneous Mathematical Symbols-B
			 * Supplemental Mathematical Operators
			 * Miscellaneous Symbols and Arrows
			 */
			'\u2000-\u2BFF',

			// Supplemental Punctuation
			'\u2E00-\u2E7F',
			']',
		].join( '' ),
		'g'
	),

	// Remove UTF-16 surrogate points, see https://en.wikipedia.org/wiki/UTF-16#U.2BD800_to_U.2BDFFF
	astralRegExp: /[\uD800-\uDBFF][\uDC00-\uDFFF]/g,
	wordsRegExp: /\S\s+/g,
	characters_excluding_spacesRegExp: /\S/g,

	/*
	 * Match anything that is not a formatting character, excluding:
	 * \f = form feed
	 * \n = new line
	 * \r = carriage return
	 * \t = tab
	 * \v = vertical tab
	 * \u00AD = soft hyphen
	 * \u2028 = line separator
	 * \u2029 = paragraph separator
	 */
	characters_including_spacesRegExp: /[^\f\n\r\t\v\u00AD\u2028\u2029]/g,
	l10n: {
		type: 'words',
	},
};
