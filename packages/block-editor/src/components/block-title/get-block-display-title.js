import {
	__experimentalGetBlockLabel as getBlockLabel,
	store as blocksStore,
} from '@wordpress/blocks';
import { store as blockEditorStore } from '../../store';

/** @typedef {import('@wordpress/data').WPDataRegistry['select']} RegistrySelect */

/**
 * Resolves a block's custom label, variation title, or registered title.
 *
 * @param {RegistrySelect} select   Registry selector accessor.
 * @param {string}         clientId Block client ID.
 * @param {string}         context  Label context.
 * @return {string|null} The block's display title.
 */
export default function getBlockDisplayTitle( select, clientId, context ) {
	if ( ! clientId ) {
		return null;
	}
	const { getBlockName, getBlockAttributes, getBlock } =
		select( blockEditorStore );
	const { getBlockType, getActiveBlockVariation } = select( blocksStore );
	const blockName = getBlockName( clientId );
	const blockType = getBlockType( blockName );
	if ( ! blockType ) {
		return null;
	}
	const attributes = getBlockAttributes( clientId );
	const label = getBlockLabel( blockType, attributes, context );
	if ( label !== blockType.title ) {
		return label;
	}
	const match = getActiveBlockVariation(
		blockName,
		attributes,
		undefined,
		getBlock?.( clientId )?.innerContent
	);
	return match?.title || blockType.title;
}
