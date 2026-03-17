/**
 * Possible ways of counting text.
 */
export type Strategy =
	| 'words'
	| 'characters_excluding_spaces'
	| 'characters_including_spaces';

/**
 * L10n settings for word counting.
 */
export interface L10n {
	/**
	 * The type of count to perform.
	 */
	type?: Strategy;

	/**
	 * Array of shortcode names to be removed during counting.
	 */
	shortcodes?: string[];
}

/**
 * Base settings fields that can be configured by users.
 */
export type UserSettings = Partial< Omit< Settings, 'type' | 'shortcodes' > >;

/**
 * Complete settings object with all required properties.
 * This includes both static defaults and dynamic runtime properties.
 */
export interface Settings {
	/**
	 * The type of count being performed (set at runtime).
	 */
	type: Strategy;

	/**
	 * Regular expression that matches HTML tags.
	 */
	HTMLRegExp: RegExp;

	/**
	 * Regular expression that matches HTML comments.
	 */
	HTMLcommentRegExp: RegExp;

	/**
	 * Regular expression that matches spaces in HTML.
	 */
	spaceRegExp: RegExp;

	/**
	 * Regular expression that matches HTML entities.
	 */
	HTMLEntityRegExp: RegExp;

	/**
	 * Regular expression that matches word connectors, like em-dash.
	 */
	connectorRegExp: RegExp;

	/**
	 * Regular expression that matches various characters to be removed when counting.
	 */
	removeRegExp: RegExp;

	/**
	 * Regular expression that matches astral UTF-16 code points.
	 */
	astralRegExp: RegExp;

	/**
	 * Regular expression that matches words.
	 */
	wordsRegExp: RegExp;

	/**
	 * Regular expression that matches characters excluding spaces.
	 */
	characters_excluding_spacesRegExp: RegExp;

	/**
	 * Regular expression that matches characters including spaces.
	 */
	characters_including_spacesRegExp: RegExp;

	/**
	 * Localization settings.
	 */
	l10n: L10n;

	/**
	 * Array of shortcode names (set at runtime from l10n.shortcodes).
	 */
	shortcodes: string[];

	/**
	 * Regular expression for matching shortcodes (generated at runtime).
	 */
	shortcodesRegExp?: RegExp;
}
