/**
 * Internal dependencies
 */
import { processBlockType } from './process-block-type';
import type { BlockBindingsSource, BlockType } from '../types';
import type { Action, BlocksStoreThunkArgs } from './types';

/**
 * Add bootstrapped block type metadata to the store. These metadata usually come from
 * the `block.json` file and are either statically bootstrapped from the server, or
 * passed as the `metadata` parameter to the `registerBlockType` function.
 *
 * @param name      Block name.
 * @param blockType Block type metadata.
 */
export function addBootstrappedBlockType(
	name: string,
	blockType: Partial< BlockType >
): Action {
	return {
		type: 'ADD_BOOTSTRAPPED_BLOCK_TYPE',
		name,
		blockType,
	};
}

/**
 * Add unprocessed block type settings to the store. These data are passed as the
 * `settings` parameter to the client-side `registerBlockType` function.
 *
 * @param name      Block name.
 * @param blockType Unprocessed block type settings.
 */
export function addUnprocessedBlockType(
	name: string,
	blockType: Partial< BlockType >
) {
	return ( { dispatch }: BlocksStoreThunkArgs ) => {
		dispatch( { type: 'ADD_UNPROCESSED_BLOCK_TYPE', name, blockType } );
		const processedBlockType = dispatch(
			processBlockType( name, blockType )
		);
		if ( ! processedBlockType ) {
			return;
		}
		dispatch.addBlockTypes( processedBlockType );
	};
}

/**
 * Adds new block bindings source.
 *
 * @param source The source to register.
 */
export function addBlockBindingsSource( source: BlockBindingsSource ): Action {
	return {
		type: 'ADD_BLOCK_BINDINGS_SOURCE',
		name: source.name,
		label: source.label,
		usesContext: source.usesContext,
		getValues: source.getValues,
		setValues: source.setValues,
		canUserEditValue: source.canUserEditValue,
		getFieldsList: source.getFieldsList,
	};
}

/**
 * Removes existing block bindings source.
 *
 * @param name Name of the source to remove.
 */
export function removeBlockBindingsSource( name: string ): Action {
	return {
		type: 'REMOVE_BLOCK_BINDINGS_SOURCE',
		name,
	};
}
