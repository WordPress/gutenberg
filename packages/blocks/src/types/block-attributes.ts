/**
 * Block Attribute Interfaces
 *
 * @module BlockAttributes
 */

/**
 * External dependencies
 */
import type { ReactChild } from 'react';

/**
 * Types of data stored by block attributes.
 *
 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-attributes/#type-validation Type Validation} on developer.wordpress.org
 */
export type AttributeSchemaType =
	| 'string'
	| 'boolean'
	| 'object'
	| 'null'
	| 'array'
	| 'integer'
	| 'number';

export type BaseAttributeSource = {
	type: AttributeSchemaType | AttributeSchemaType[];
};

/**
 * Used in [get-block-attributes.js](../api/parser/get-block-attributes.js)
 *
 * - [ ] TODO this isn't defined in {@link https://github.com/WordPress/gutenberg/blob/trunk/schemas/json/block.json block.json}
 * - [ ] TODO is this only used internally?
 *
 * @internal
 */
export interface Raw {
	source: 'raw';
	type: 'string'; // TODO is this correct?
}

/**
 * Attribute sourced from an attribute of a tag in the markup.
 *
 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-attributes/#attribute-source Attribute Source} on developer.wordpress.org
 * @public
 */
export type Attribute = {
	source: 'attribute';
	attribute: string;
	selector?: string;
} & (
	| {
			type: 'boolean';
			default?: boolean;
	  }
	| {
			type: 'number';
			default?: number;
	  }
	| {
			type: 'string';
			default?: string;
	  }
 );

/**
 * Used in [get-block-attributes.js](../api/parser/get-block-attributes.js)
 *
 * - [ ] TODO this isn't defined in {@link https://github.com/WordPress/gutenberg/blob/trunk/schemas/json/block.json block.json}
 * - [ ] TODO is this only used internally?
 *
 * @internal
 */
export interface Property {
	source: 'property';
	type: 'string'; // TODO is this correct?
}

/**
 * @internal
 */
export interface Children {
	source: 'children';
	type: 'array';
	selector?: string;
}

/**
 * Used in [get-block-attributes.js](../api/parser/get-block-attributes.js)
 *
 * - [ ] TODO this isn't defined in {@link https://github.com/WordPress/gutenberg/blob/trunk/schemas/json/block.json block.json}
 * - [ ] TODO is this only used internally?
 *
 * @internal
 */
export interface Node {
	source: 'node';
	type: 'string'; // TODO is this correct?
	selector?: string;
}

/**
 * Used in [get-block-attributes.js](../api/parser/get-block-attributes.js)
 *
 * - [ ] TODO this isn't defined in {@link https://github.com/WordPress/gutenberg/blob/trunk/schemas/json/block.json block.json}
 * - [ ] TODO is this only used internally?
 *
 * @internal
 */
export interface Tag {
	source: 'tag';
	type: 'string'; // TODO is this correct?
	selector?: string;
}

/**
 * Attribute sourced from the inner HTML from markup.
 *
 * Typically used by RichText. Note that text is returned according to the rules of {@link https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML innerHTML} on developer.wordpress.org
 *
 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-attributes/#html-source HTML Source} on developer.wordpress.org
 * @public
 */
export interface HTML {
	source: 'html';
	type: 'string';
	multiline?: 'li' | 'p';
	selector?: string;
	default?: string;
}

/**
 * Attribute sourced from a post’s meta.
 *
 * {@link https://github.com/WordPress/gutenberg/blob/c367c4e2765f9e6b890d1565db770147efca5d66/packages/core-data/src/entity-provider.js  EntityProvider and related hook APIs} should be used instead.
 *
 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-attributes/#meta-source-deprecated Meta Source} on developer.wordpress.org
 * @deprecated
 * @public
 */
export interface Meta {
	source: 'meta';
	type: 'string';
	meta: string;
	default?: string;
}

/**
 * Attribute sourced from array of values from markup.
 *
 * Entries of the array are determined by the selector argument, where each matched element within
 * the block will have an entry structured corresponding to the second argument, an object of
 * attribute sources.
 *
 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-attributes/#query-source Query Source} on developer.wordpress.org
 * @public
 */
export interface Query< T > {
	source: 'query';
	type: 'array';
	selector: string;
	query: {
		[ k in keyof T ]: BlockAttribute<
			T[ k ] extends Array< infer U > ? U : T[ k ]
		>;
	};
	default?: any[];
}

/**
 * Use text to extract the inner text from markup.
 *
 * Note that HTML is returned according to the rules of {@link https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent textContent }.
 *
 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-attributes/#text-source Text Source} on developer.wordpress.org
 * @public
 */
export interface Text {
	source: 'text';
	type: 'string';
	selector?: string;
	default?: string;
}

/**
 * @internal
 */
export type None =
	| {
			source?: never;
	  } & (
			| {
					type: 'array';
					default?: any[];
			  }
			| {
					type: 'object';
					default?: object;
			  }
			| {
					type: 'boolean';
					default?: boolean;
			  }
			| {
					type: 'number';
					default?: number;
			  }
			| {
					type: 'string';
					default?: string;
			  }
	   );

/**
 * @internal
 */
export type Primitive = 'array' | 'object' | 'boolean' | 'number' | 'string';

/**
 * Union of block attribute schemas.
 *
 * @public
 */
export type BlockAttributeSchema< T > = (
	| Raw
	| Attribute
	| Property
	| Children
	| Node
	| Tag
	| HTML
	| Meta
	| Query< T >
	| Text
	| None
 ) & {
	/**
	 * Role of the block.
	 *
	 * Used in [selectors.js](../store/selectors.js) and [utils.js](../api/utils.js)
	 *
	 * @internal
	 */
	__experimentalRole?: string;
};

/**
 * @public
 */
export type BlockAttribute< T > = BlockAttributeSchema< T > | Primitive;

/**
 * Attributes definition providing information about the data stored by a block.
 *
 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-attributes/ Attributes}
 * @public
 */
export type BlockAttributes< T extends Record< string, any > = {} > = Record<
	string,
	BlockAttribute< T >
> & {
	/**
	 * Provide an additional `className`, which used to be supported in the `core/comments-query-loop` block.
	 *
	 * Used in [convert-legacy-block.js](../api/parser/convert-legacy-block.js) and
	 * [fix-custom-classname.js](../api/parser/fix-custom-classname.js)
	 *
	 * @deprecated This is a legacy property and should not be used.
	 */
	className?: string;

	/**
	 * Used in [convert-legacy-block.js](../api/parser/convert-legacy-block.js)
	 *
	 * @deprecated This is a legacy property and should not be used.
	 */
	legacy?: boolean;

	/**
	 * Used in [convert-legacy-block.js](../api/parser/convert-legacy-block.js)
	 *
	 * @deprecated This is a legacy property and should not be used.
	 */
	responsive?: boolean;

	/**
	 * Used in [convert-legacy-block.js](../api/parser/convert-legacy-block.js)
	 *
	 * @deprecated This is a legacy property and should not be used.
	 */
	service?: string;
};

/**
 * Return type of [`parseWithAttributeSchema`](../api/parser/get-block-attributes.js).
 */
export type SourceReturnValue< T > = T extends Attribute & { type: 'boolean' }
	? boolean | undefined
	: T extends Children
	? ReactChild[]
	: T extends Node
	? JSX.Element | null
	: T extends Tag
	? keyof ( HTMLElementTagNameMap & SVGElementTagNameMap ) | undefined
	: T extends Query< infer U >
	? {
			[ k in keyof U ]: U[ k ] extends Query< infer V >
				? SourceReturnValue< Query< V > >
				: SourceReturnValue< U[ k ] >;
	  }
	: string | undefined;
