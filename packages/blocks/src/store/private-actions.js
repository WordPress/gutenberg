/**
 * Internal dependencies
 */
import { processBlockType } from './process-block-type';

/** @typedef {import('../api/registration').WPBlockType} WPBlockType */

/**
 * Add block type metadata to the store.
 *
 * @param {string}      name      Block name.
 * @param {WPBlockType} blockType Block type metadata.
 */
export function addBootstrappedBlock( name, blockType ) {
	return {
		type: 'ADD_BOOTSTRAPPED_BLOCK_TYPE',
		name,
		blockType,
	};
}

/**
 * Add unprocessed block type settings to the store.
 *
 * @param {string}      name      Block name.
 * @param {WPBlockType} blockType Unprocessed block type settings.
 */
export const addUnprocessedBlock =
	( name, blockType ) =>
	( { dispatch } ) => {
		dispatch( { type: 'ADD_UNPROCESSED_BLOCK_TYPE', name, blockType } );
		const processedBlockType = dispatch(
			processBlockType( name, blockType )
		);
		if ( ! processedBlockType ) {
			return;
		}
		dispatch.addBlockTypes( processedBlockType );
	};
