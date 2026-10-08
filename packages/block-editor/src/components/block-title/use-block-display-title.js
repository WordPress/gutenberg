import { useSelect } from '@wordpress/data';
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
export function getBlockDisplayTitle( select, clientId, context ) {
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

/**
 * Returns the block's configured title as a string, or empty if the title
 * cannot be determined.
 *
 * @example
 *
 * ```js
 * useBlockDisplayTitle( { clientId: 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1', maximumLength: 17 } );
 * ```
 *
 * @param {Object}           props
 * @param {string}           props.clientId      Client ID of block.
 * @param {number|undefined} props.maximumLength The maximum length that the block title string may be before truncated.
 * @param {string|undefined} props.context       The context to pass to `getBlockLabel`.
 * @return {?string} Block title.
 */
export default function useBlockDisplayTitle( {
	clientId,
	maximumLength,
	context,
} ) {
	const blockTitle = useSelect(
		( select ) => getBlockDisplayTitle( select, clientId, context ),
		[ clientId, context ]
	);

	if ( ! blockTitle ) {
		return null;
	}

	if (
		maximumLength &&
		maximumLength > 0 &&
		blockTitle.length > maximumLength
	) {
		const omission = '...';
		return (
			blockTitle.slice( 0, maximumLength - omission.length ) + omission
		);
	}

	return blockTitle;
}
