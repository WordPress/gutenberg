/**
 * WordPress dependencies
 */
import type { ThunkArgs } from '@wordpress/data';

/**
 * Internal dependencies
 */
import type {
	BlockType,
	BlockCategory,
	BlockCollection,
	BlockStyle,
	BlockVariation,
	BlockBindingsSource,
	Icon,
} from '../types';
import type { store } from '.';
import type * as privateSelectors from './private-selectors';
import type * as privateActions from './private-actions';

/**
 * The state of the `core/blocks` redux store.
 */
export interface BlockStoreState {
	/**
	 * Bootstrapped block types from server-side definitions.
	 */
	bootstrappedBlockTypes: Record< string, Partial< BlockType > >;
	/**
	 * Unprocessed block types pending filter application.
	 */
	unprocessedBlockTypes: Record< string, Partial< BlockType > >;
	/**
	 * Block types by name.
	 */
	blockTypes: Record< string, BlockType >;
	/**
	 * Block styles by block name.
	 */
	blockStyles: Record< string, BlockStyle[] >;
	/**
	 * Block variations by block name.
	 */
	blockVariations: Record< string, BlockVariation[] >;
	/**
	 * Name of the default block.
	 */
	defaultBlockName: string | null;
	/**
	 * Name of the block for handling non-block content.
	 */
	freeformFallbackBlockName: string | null;
	/**
	 * Name of the block for handling unregistered blocks.
	 */
	unregisteredFallbackBlockName: string | null;
	/**
	 * Name of the block for handling the grouping of blocks.
	 */
	groupingBlockName: string | null;
	/**
	 * The available block categories.
	 */
	categories: BlockCategory[];
	/**
	 * The available collections.
	 */
	collections: Record< string, BlockCollection >;
	/**
	 * Block bindings sources by name.
	 * The stored form omits `name` since it's the record key.
	 */
	blockBindingsSources: Record< string, Omit< BlockBindingsSource, 'name' > >;
}

/**
 * Store action types.
 */
export type Action =
	| {
			type: 'ADD_BOOTSTRAPPED_BLOCK_TYPE';
			name: string;
			blockType: Record< string, unknown >;
	  }
	| {
			type: 'ADD_UNPROCESSED_BLOCK_TYPE';
			name: string;
			blockType: Partial< BlockType >;
	  }
	| { type: 'ADD_BLOCK_TYPES'; blockTypes: BlockType[] }
	| { type: 'REMOVE_BLOCK_TYPES'; names: string[] }
	| {
			type: 'ADD_BLOCK_STYLES';
			blockNames: string[];
			styles: BlockStyle[];
	  }
	| {
			type: 'REMOVE_BLOCK_STYLES';
			blockName: string;
			styleNames: string[];
	  }
	| {
			type: 'ADD_BLOCK_VARIATIONS';
			blockName: string;
			variations: BlockVariation[];
	  }
	| {
			type: 'REMOVE_BLOCK_VARIATIONS';
			blockName: string;
			variationNames: string[];
	  }
	| { type: 'SET_DEFAULT_BLOCK_NAME'; name: string }
	| { type: 'SET_FREEFORM_FALLBACK_BLOCK_NAME'; name: string }
	| { type: 'SET_UNREGISTERED_FALLBACK_BLOCK_NAME'; name: string }
	| { type: 'SET_GROUPING_BLOCK_NAME'; name: string }
	| { type: 'SET_CATEGORIES'; categories: BlockCategory[] }
	| {
			type: 'UPDATE_CATEGORY';
			slug: string;
			category: Partial< BlockCategory >;
	  }
	| {
			type: 'ADD_BLOCK_COLLECTION';
			namespace: string;
			title: string;
			icon?: Icon;
	  }
	| { type: 'REMOVE_BLOCK_COLLECTION'; namespace: string }
	| {
			type: 'ADD_BLOCK_BINDINGS_SOURCE';
			name: string;
			label?: string;
			usesContext?: string[];
			getValues?: Function;
			setValues?: Function;
			canUserEditValue?: Function;
			getFieldsList?: Function;
	  }
	| { type: 'REMOVE_BLOCK_BINDINGS_SOURCE'; name: string };

/**
 * Thunk arguments for the blocks store, including private selectors and actions.
 */
export type BlocksStoreThunkArgs = ThunkArgs<
	typeof store,
	typeof privateSelectors,
	typeof privateActions
>;
