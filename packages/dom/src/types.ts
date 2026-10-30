export interface SemanticElementDefinition {
	/**
	 * Content attributes
	 */
	attributes?: string[];
	/**
	 * Allowed child elements, or `'*'` for any
	 */
	children?: ContentSchema | '*';
}

export type ContentSchema = Record< string, SemanticElementDefinition >;

export interface FindFocusableOptions {
	/**
	 * If set, only return elements that are sequentially focusable.
	 * Non-interactive elements with a negative `tabindex` are focusable but
	 * not sequentially focusable.
	 */
	sequential?: boolean;
}

export type MaybeHTMLInputElement = HTMLElement & {
	type?: string;
	checked?: boolean;
	name?: string;
};

export interface ObjectTabbable {
	element: HTMLElement;
	index: number;
}
