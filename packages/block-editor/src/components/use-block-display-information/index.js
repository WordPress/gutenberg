/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	store as blocksStore,
	isReusableBlock,
	isTemplatePart,
	__experimentalGetBlockLabel as getBlockLabel,
} from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

/** @typedef {import('@wordpress/blocks').WPIcon} WPIcon */

/**
 * Contains basic block's information for display reasons.
 *
 * @typedef {Object} WPBlockDisplayInformation
 *
 * @property {boolean} isSynced    True if is a reusable block or template part
 * @property {string}  title       Human-readable block type label.
 * @property {WPIcon}  icon        Block type icon.
 * @property {string}  description A detailed block type description.
 * @property {string}  anchor      HTML anchor.
 * @property {name}    name        A custom, human readable name for the block.
 */

/**
 * Get the display label for a block's position type.
 *
 * @param {Object} attributes Block attributes.
 * @return {string} The position type label.
 */
function getPositionTypeLabel( attributes ) {
	const positionType = attributes?.style?.position?.type;

	if ( positionType === 'sticky' ) {
		return __( 'Sticky' );
	}

	if ( positionType === 'fixed' ) {
		return __( 'Fixed' );
	}

	return null;
}

/**
 * Hook used to try to find a matching block variation and return
 * the appropriate information for display reasons. In order to
 * to try to find a match we need to things:
 * 1. Block's client id to extract it's current attributes.
 * 2. A block variation should have set `isActive` prop to a proper function.
 *
 * If for any reason a block variation match cannot be found,
 * the returned information come from the Block Type.
 * If no blockType is found with the provided clientId, returns null.
 *
 * @param {string} clientId Block's client id.
 * @return {?WPBlockDisplayInformation} Block's display information, or `null` when the block or its type not found.
 */

export default function useBlockDisplayInformation( clientId ) {
	return useSelect(
		( select ) => {
			if ( ! clientId ) {
				return null;
			}
			const { getBlockName, getBlockAttributes } =
				select( blockEditorStore );
			const { getBlockType, getActiveBlockVariation } =
				select( blocksStore );
			const blockName = getBlockName( clientId );
			const blockType = getBlockType( blockName );
			if ( ! blockType ) {
				return null;
			}
			const attributes = getBlockAttributes( clientId );
			const match = getActiveBlockVariation( blockName, attributes );
			const isSynced =
				isReusableBlock( blockType ) || isTemplatePart( blockType );
			const syncedTitle = isSynced
				? getBlockLabel( blockType, attributes )
				: undefined;
			const title = syncedTitle || blockType.title;
			const positionLabel = getPositionTypeLabel( attributes );
			const blockTypeInfo = {
				isSynced,
				title,
				icon: blockType.icon,
				description: blockType.description,
				anchor: attributes?.anchor,
				positionLabel,
				positionType: attributes?.style?.position?.type,
				name: attributes?.metadata?.name,
			};
			if ( ! match ) {
				return blockTypeInfo;
			}

			return {
				isSynced,
				title: match.title || blockType.title,
				icon: match.icon || blockType.icon,
				description: match.description || blockType.description,
				anchor: attributes?.anchor,
				positionLabel,
				positionType: attributes?.style?.position?.type,
				name: attributes?.metadata?.name,
			};
		},
		[ clientId ]
	);
}
