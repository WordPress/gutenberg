/**
 * Internal dependencies
 */
import { processBlockType } from './process-block-type';

/** @typedef {import('../api/registration').WPBlockType} WPBlockType */

/**
 * Add bootstrapped block type metadata to the store. These metadata usually come from
 * the `block.json` file and are either statically boostrapped from the server, or
 * passed as the `metadata` parameter to the `registerBlockType` function.
 *
 * @param {string}      name      Block name.
 * @param {WPBlockType} blockType Block type metadata.
 */
export function addBootstrappedBlockType( name, blockType ) {
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
 * @param {string}      name      Block name.
 * @param {WPBlockType} blockType Unprocessed block type settings.
 */
export function addUnprocessedBlockType( name, blockType ) {
	return ( { dispatch } ) => {
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
 * @param {string} source Name of the source to register.
 */
export function addBlockBindingsSource( source ) {
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
 * @param {string} name Name of the source to remove.
 */
export function removeBlockBindingsSource( name ) {
	return {
		type: 'REMOVE_BLOCK_BINDINGS_SOURCE',
		name,
	};
}
