/**
 * Internal dependencies
 */
import type {
	BlockCategory,
	BlockCollection,
	BlockVariation,
	BlockStyle,
	BlockType,
} from '../types';

/**
 * The state of the `core/blocks` redux store.
 *
 * @public
 */
export type BlockStoreState = {
	/**
	 * Block variations by block name.
	 */
	blockVariations: Record< string, BlockVariation[] >;

	/**
	 * Block styles by block name.
	 */
	blockStyles: Record< string, BlockStyle[] >;

	/**
	 * Block type by name.
	 */
	blockTypes: Record< string, BlockType< any > >;

	/**
	 * The available block categories.
	 */
	categories: BlockCategory[];

	/**
	 * The available collections.
	 */
	collections: BlockCollection[];

	/**
	 * Name of the default block name.
	 */
	defaultBlockName?: string;

	/**
	 * Name of the block for handling non-block content.
	 */
	freeformFallbackBlockName?: string;

	/**
	 * Name of the block for handling unregistered blocks.
	 */
	unregisteredFallbackBlockName?: string;

	/**
	 * Name of the block for handling the grouping of blocks.
	 */
	groupingBlockName?: string;

	/**
	 * Unprocessed block types.
	 */
	unprocessedBlockTypes?: any[];
};
