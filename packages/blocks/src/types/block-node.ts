/**
 * Block Node Interface
 *
 * @module BlockNode
 */

/**
 * The "block node" represents a transition from serialized block data
 * into a fully-loaded block with its implementation. It contains the
 * information parsed from the input document; be that serialized HTML
 * as is the default case in WordPress, or directly loaded from a
 * structured data store.
 *
 * Block nodes do not indicate all of a block's attributes, as some of
 * its attributes may be sourced later on from the `innerHTML` by the
 * block implementation. This is one example of where the block node
 * is not a complete "block" and requires further processing.
 *
 * Block validation only examines `innerHTML` and delegates the validation
 * of any inner blocks to the block loading process for those blocks.
 * This prevents an issue with a potentially deeply-nested inner block
 * from cascading up and invalidating all of its parent blocks.
 *
 * @public
 */
export type BlockNode = {
	/**
	 * Name indicating namespaced block type, e.g. for example, "myplugin/my-interesting-block".
	 * A `null` block name is given to a section of freeform HTML content.
	 */
	blockName?: string;

	/**
	 * Attributes sourced from parsed JSON in the block comment delimiters.
	 * When unable to parse block comment attributes, `attrs` will be `null`.
	 */
	attrs?: Record< string, any >;

	/**
	 * Full text inside block boundaries excluding inner block content.
	 */
	innerHTML: string;

	/**
	 * Indicates arrangement of text chunks and inner blocks.
	 */
	innerContent: Array< string | null >;

	/**
	 * Nested block nodes; may be empty.
	 */
	innerBlocks: BlockNode[];
};
