export interface EditorStyle {
	/** The CSS block(s), as a single string. */
	css: string;
	/** The base URL to be used as the reference when rewriting urls. */
	baseURL?: string;
	/** The selectors not to wrap. */
	ignoredSelectors?: ( string | RegExp )[];
}

export interface TransformOptions {
	/** The selectors not to wrap. */
	ignoredSelectors?: ( string | RegExp )[];
}
