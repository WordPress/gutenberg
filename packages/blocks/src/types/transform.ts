/**
 * Block Transform Interfaces
 *
 * @module blocks/Transform
 */

/**
 * Internal dependencies
 */
import type { Block } from './block';
import type { BlockType } from './block-type';

/**
 * A content model used to validate and process pasted {@link TransformRaw raw} content.
 *
 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-transforms/#schemas-and-content-models Transforms Schema and Content Models} on developer.wordpress.org
 * @public
 */
export type TransformRawSchema = {
	[ k in keyof HTMLElementTagNameMap | '#text' ]?: {
		attributes?: string[];
		require?: Array< keyof HTMLElementTagNameMap >;
		classes?: Array< string | RegExp >;
		children?: TransformRawSchema;
	};
};

/**
 * Transform block into a different {@link BlockType }.
 *
 * Supports both _from_ and _to_ directions.
 *
 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-transforms/#block Transforms Block} on developer.wordpress.org
 * @public
 */
export type TransformBlock< Attributes extends Record< string, any > > = {
	type: 'block';
	blocks: string[];
	isMatch?( attributes: Attributes, block: string | string[] ): boolean;
	isMultiBlock?: boolean;
	transform( attributes: Attributes ): Block< Partial< Attributes > >;
};

/**
 * Transform allowing blocks to be created from content introduced by the user.
 *
 * Supports the _from_ direction. Applied in a new block line after the user has introduced some
 * content and hit the ENTER key.
 *
 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-transforms/#enter Transforms Enter} on developer.wordpress.org
 * @public
 */
export type TransformEnter< Attributes extends Record< string, any > > = {
	type: 'enter';
	regExp: RegExp;
	transform(): Block< Partial< Attributes > >;
};

/**
 * Transform allowing blocks to be created from files dropped into the editor.
 *
 * Supports the _from_ direction,
 *
 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-transforms/#files Transforms Files} on developer.wordpress.org
 * @public
 */
export type TransformFiles< Attributes extends Record< string, any > > = {
	type: 'files';
	isMatch?( files: FileList ): boolean;
	transform(
		files: FileList,
		onChange?: ( id: string, attrs: Attributes ) => void
	): Block< Partial< Attributes > >;
};

/**
 * Transform allowing blocks to be created from text typed by the user.
 *
 * Supports the _from_ direction. Applied when, in a new block line, the user types some text and
 * then adds a trailing space.
 *
 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-transforms/#prefix Transforms Prefix} on developer.wordpress.org
 * @public
 */
export type TransformPrefix< Attributes extends Record< string, any > > = {
	type: 'prefix';
	prefix: string;
	transform( content: string ): Block< Partial< Attributes > >;
};

/**
 * Transform allowing blocks to be created from raw HTML nodes.
 *
 * Supports the _from_ direction. Applied when the user executes the “Convert to Blocks” action
 * from within the block setting UI menu, as well as when some content is pasted or dropped into
 * the editor.
 *
 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-transforms/#raw Transforms Raw} on developer.wordpress.org
 * @public
 */
export type TransformRaw< Attributes extends Record< string, any > > = {
	type: 'raw';
	/**
	 * Comma-separated list of selectors, no spaces.
	 *
	 * @example 'p,div,h1,.css-class,#id'
	 */
	selector?: string;
	schema?: TransformRawSchema;
	isMatch?( node: Node ): boolean;
	transform?( node: Node ): Block< Partial< Attributes > > | void;
};

/**
 * Transform allowing blocks to be created from shortcodes.
 *
 * Support the _from_ direction. Applied as part of the raw transformation process.
 *
 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-transforms/#shortcode Transforms Shortcode} on developer.wordpress.org
 * @public
 */
export type TransformShortcode< Attributes extends Record< string, any > > = {
	type: 'shortcode';
	tag: string;
	transform?(
		attributes: any,
		match: Record< string, any > // TODO type shortcode
	): Block< Attributes >;
	attributes?: any; // TODO find type
};

/**
 * Transform a block to and from other blocks types, as well as from other entities.
 *
 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-transforms/ Transforms} on developer.wordpress.org
 * @public
 */
export type Transform< T extends Record< string, any > = {} > = (
	| TransformBlock< T >
	| TransformEnter< T >
	| TransformFiles< T >
	| TransformPrefix< T >
	| TransformRaw< T >
	| TransformShortcode< T >
) & {
	priority?: number;

	/**
	 * Whether there are any mobile block transforms.
	 *
	 * Used in [factory.js](../api/factory.js)
	 */
	usingMobileTransformations?: boolean;

	/**
	 * Function that defines how blocks are transformed from particular block types.
	 *
	 * @param blocks Block or Blocks to convert.
	 * @internal
	 */
	__experimentalConvert( blocks: Block | Block[] ): Block | Block[] | null;
};
