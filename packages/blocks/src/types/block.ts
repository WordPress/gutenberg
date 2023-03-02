/**
 * Block Interface
 *
 * @module blocks/Block
 */

/**
 * Internal dependencies
 */
import type { BlockNode } from './block-node';

/**
 * Instance of a [BlockType](./block-type.ts).
 *
 * @public
 */
export interface Block< Attributes extends Record< string, any > = {} > {
	/**
	 * Name used to uniquely identify block type, e.g. core/paragraph.
	 *
	 * The block name comprises a namespace part and a name part separated
	 * by a "/". The namespace is usually the name of the plugin providing
	 * the block, for example, "myplugin/my-interesting-block".
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-registration/#block-name
	 */
	name: string;

	/**
	 * Description of block's attribute types.
	 *
	 * These define how to source the attributes for a block and
	 * may provide default values in case they aren't available.
	 *
	 * Example
	 *     {
	 *       "url": {
	 *         "type": "string",
	 *         "source": "attribute",
	 *         "selector": "img",
	 *         "attribute": "src"
	 *       }
	 *     }
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-attributes/
	 */
	attributes: Attributes;

	/**
	 * Auto-generated ID unique to the loaded block inside the editor.
	 *
	 * Many functions in the editor reference blocks by their client id
	 * in order to modify or rearrange blocks. This is set when loading
	 * blocks and does not persist between edit sessions.
	 *
	 * Example:
	 *     const clientId = select( blockEditorStore ).getSelectedBlockClientId();
	 *     const prevId   = select( blockEditorStore ).getPreviousBlockClientId( clientId );
	 *     useDispatch( blockEditorStore ).replaceBlock( prevId, newBlock );
	 */
	clientId: string;

	/**
	 * Array of inner blocks, if the block has any.
	 */
	innerBlocks: Block[];

	/**
	 * Indicates whether or not the block is valid.
	 */
	isValid: boolean;

	/**
	 * Original block HTML from source document, used by the unrecognized block type.
	 */
	originalContent?: string;

	/**
	 * Contains descriptions of any block validation issues that appear in loading the block.
	 */
	validationIssues?: Array< Record< string, any > >;

	/**
	 * Un-processed original copy of block, used for preserving invalid blocks.
	 */
	__unstableBlockSource?: BlockNode;
}
