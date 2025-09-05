/**
 * Shortcode attributes object.
 */
export type ShortcodeAttrs = {
	/**
	 * Object with named attributes.
	 */
	named: Record< string, string | undefined >;

	/**
	 * Array with numeric attributes.
	 */
	numeric: string[];
};

export type ShortcodeMatch = {
	/**
	 * Index the shortcode is found at.
	 */
	index: number;

	/**
	 * Matched content.
	 */
	content: string;

	/**
	 * Shortcode instance of the match.
	 */
	shortcode: Shortcode;
};

/**
 * Shortcode options.
 */
export interface ShortcodeOptions {
	/**
	 * Shortcode tag.
	 */
	tag: string;

	/**
	 * Shortcode attributes.
	 */
	attrs?: Partial< ShortcodeAttrs > | string;

	/**
	 * Shortcode content.
	 */
	content?: string;

	/**
	 * Shortcode type: `self-closing`, `closed`, or `single`.
	 */
	type?: 'self-closing' | 'closed' | 'single';
}

/**
 * Shortcode object.
 */
export interface Shortcode extends ShortcodeOptions {
	/**
	 * Shortcode attributes.
	 */
	attrs: ShortcodeAttrs;
}

export type Match =
	| NonNullable< ReturnType< RegExp[ 'exec' ] > >
	| Array< string >;

export type ReplaceCallback = ( shortcode: Shortcode ) => string;

/**
 * WordPress Shortcode instance.
 */
export interface shortcode {
	new ( options: Partial< ShortcodeOptions > ): Shortcode & {
		/**
		 * Transform the shortcode into a string.
		 *
		 * @return {string} String representation of the shortcode.
		 */
		string: () => string;

		/**
		 * Get a shortcode attribute.
		 *
		 * Automatically detects whether `attr` is named or numeric and routes it
		 * accordingly.
		 *
		 * @param {(number|string)} attr Attribute key.
		 *
		 * @return {string} Attribute value.
		 */
		get: ( attr: string | number ) => string | undefined;

		/**
		 * Set a shortcode attribute.
		 *
		 * Automatically detects whether `attr` is named or numeric and routes it
		 * accordingly.
		 *
		 * @param {(number|string)} attr  Attribute key.
		 * @param {string}          value Attribute value.
		 *
		 * @return {InstanceType< shortcode >} Shortcode instance.
		 */
		set: (
			attr: string | number,
			value: string
		) => InstanceType< shortcode >;
	};

	/**
	 * Parse shortcode attributes.
	 *
	 * Shortcodes accept many types of attributes. These can chiefly be divided into
	 * named and numeric attributes:
	 *
	 * Named attributes are assigned on a key/value basis, while numeric attributes
	 * are treated as an array.
	 *
	 * Named attributes can be formatted as either `name="value"`, `name='value'`,
	 * or `name=value`. Numeric attributes can be formatted as `"value"` or just
	 * `value`.
	 *
	 * @param text Serialised shortcode attributes.
	 *
	 * @return Parsed shortcode attributes.
	 */
	attrs: ( text: string ) => ShortcodeAttrs;

	/**
	 * Generate a Shortcode Object from a RegExp match.
	 *
	 * Accepts a `match` object from calling `regexp.exec()` on a `RegExp` generated
	 * by `regexp()`. `match` can also be set to the `arguments` from a callback
	 * passed to `regexp.replace()`.
	 *
	 * @param match Match array.
	 *
	 * @return  Shortcode instance.
	 */
	fromMatch: ( match: Match ) => InstanceType< shortcode >;

	/**
	 * Find the next matching shortcode.
	 *
	 * @param tag   Shortcode tag.
	 * @param text  Text to search.
	 * @param index Index to start search from.
	 *
	 * @return Matched information.
	 */
	next: (
		tag: string,
		text: string,
		index?: number
	) => ShortcodeMatch | undefined;

	/**
	 * Generate a RegExp to identify a shortcode.
	 *
	 * The base regex is functionally equivalent to the one found in
	 * `get_shortcode_regex()` in `wp-includes/shortcodes.php`.
	 *
	 * Capture groups:
	 *
	 * 1. An extra `[` to allow for escaping shortcodes with double `[[]]`
	 * 2. The shortcode name
	 * 3. The shortcode argument list
	 * 4. The self closing `/`
	 * 5. The content of a shortcode when it wraps some content.
	 * 6. The closing tag.
	 * 7. An extra `]` to allow for escaping shortcodes with double `[[]]`
	 *
	 * @param tag Shortcode tag.
	 *
	 * @return Shortcode RegExp.
	 */
	regexp: ( tag: string ) => RegExp;

	/**
	 * Replace matching shortcodes in a block of text.
	 *
	 * @param tag      Shortcode tag.
	 * @param text     Text to search.
	 * @param callback Function to process the match and return
	 *                 replacement string.
	 *
	 * @return Text with shortcodes replaced.
	 */
	replace: ( tag: string, text: string, callback: ReplaceCallback ) => string;

	/**
	 * Generate a string from shortcode parameters.
	 *
	 * Creates a shortcode instance and returns a string.
	 *
	 * Accepts the same `options` as the `shortcode()` constructor, containing a
	 * `tag` string, a string or object of `attrs`, a boolean indicating whether to
	 * format the shortcode using a `single` tag, and a `content` string.
	 *
	 * @param options
	 *
	 * @return  String representation of the shortcode.
	 */
	string: ( options: ShortcodeOptions ) => string;
}
