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

/**
 * Shortcode object.
 */
export interface Shortcode {
	/**
	 * Shortcode tag.
	 */
	tag?: string;

	/**
	 * Shortcode attributes.
	 */
	attrs: ShortcodeAttrs;

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
 * Shortcode match result.
 */
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
 * Shortcode options for creating a new shortcode.
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
 * Match array from regexp.exec() or arguments from replace callback.
 */
export type Match =
	| NonNullable< ReturnType< RegExp[ 'exec' ] > >
	| IArguments
	| ArrayLike< string >;

/**
 * Callback function for replace operations.
 */
export type ReplaceCallback = ( shortcode: Shortcode ) => string;

/**
 * Shortcode instance returned by the constructor.
 */
export interface ShortcodeInstance extends Shortcode {
	/**
	 * Transform the shortcode into a string.
	 *
	 * @return String representation of the shortcode.
	 */
	string: () => string;

	/**
	 * Get a shortcode attribute.
	 *
	 * Automatically detects whether `attr` is named or numeric and routes it
	 * accordingly.
	 *
	 * @param attr Attribute key.
	 *
	 * @return Attribute value.
	 */
	get: ( attr: string | number ) => string | undefined;

	/**
	 * Set a shortcode attribute.
	 *
	 * Automatically detects whether `attr` is named or numeric and routes it
	 * accordingly.
	 *
	 * @param attr  Attribute key.
	 * @param value Attribute value.
	 *
	 * @return Shortcode instance.
	 */
	set: ( attr: string | number, value: string ) => ShortcodeInstance;
}

/**
 * Shortcode constructor interface with both constructor and static methods.
 */
export interface ShortcodeConstructor {
	new ( options?: Partial< ShortcodeOptions > ): ShortcodeInstance;

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
	 * Parse shortcode attributes.
	 *
	 * Shortcodes accept many types of attributes. These can chiefly be divided into
	 * named and numeric attributes.
	 *
	 * @param text Serialised shortcode attributes.
	 *
	 * @return Parsed shortcode attributes.
	 */
	attrs: ( text: string ) => ShortcodeAttrs;

	/**
	 * Generate a string from shortcode parameters.
	 *
	 * Creates a shortcode instance and returns a string.
	 *
	 * Accepts the same `options` as the `Shortcode` constructor, containing a
	 * `tag` string, a string or object of `attrs`, a boolean indicating whether to
	 * format the shortcode using a `single` tag, and a `content` string.
	 *
	 * @param options
	 *
	 * @return String representation of the shortcode.
	 */
	string: ( options: ShortcodeOptions ) => string;

	/**
	 * Generate a Shortcode Object from a RegExp match.
	 *
	 * Accepts a `match` object from calling `regexp.exec()` on a `RegExp` generated
	 * by `regexp()`. `match` can also be set to the `arguments` from a callback
	 * passed to `regexp.replace()`.
	 *
	 * @param match Match array.
	 *
	 * @return Shortcode instance.
	 */
	fromMatch: ( match: Match ) => ShortcodeInstance;
}
