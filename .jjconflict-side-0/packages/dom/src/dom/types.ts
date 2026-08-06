export interface SchemaItem {
	/**
	 * Attributes.
	 */
	attributes?: string[];
	/**
	 * Classnames or RegExp to test against. Use '*' to keep all classes.
	 */
	classes?: ( string | RegExp )[];
	/**
	 * Child schemas.
	 */
	children?: '*' | { [ tag: string ]: SchemaItem };
	/**
	 * Selectors to test required children against. Leave empty or undefined if there are no requirements.
	 */
	require?: string[];
	/**
	 * Whether to allow nodes without children.
	 */
	allowEmpty?: boolean;
	/**
	 * Function to test whether a node is a match. If left undefined any node will be assumed to match.
	 */
	isMatch?: ( node: Node ) => boolean;
}

export type Schema = { [ tag: string ]: SchemaItem };
