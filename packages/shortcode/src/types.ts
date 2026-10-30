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
	tag: string;

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
