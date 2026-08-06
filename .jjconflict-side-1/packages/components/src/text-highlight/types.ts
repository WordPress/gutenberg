export type TextHighlightProps = {
	/**
	 * The string to search for and highlight within the `text`. Case
	 * insensitive. Multiple matches.
	 *
	 * @default ''
	 */
	highlight: string;
	/**
	 * The string of text to be tested for occurrences of then given
	 * `highlight`.
	 *
	 * @default ''
	 */
	text: string;
};
