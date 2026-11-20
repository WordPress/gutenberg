export interface EditorStyle {
	/** The CSS block(s), as a single string. */
	css: string;
	/** The base URL to be used as the reference when rewriting urls. */
	baseURL?: string;
	/**
	 * The URL of a file with exactly this CSS, which a document can link
	 * instead of inserting the CSS, when it doesn't need to be transformed.
	 */
	href?: string;
	/** The selectors not to wrap. */
	ignoredSelectors?: ( string | RegExp )[];
}

export interface TransformOptions {
	/** The selectors not to wrap. */
	ignoredSelectors?: ( string | RegExp )[];
}
