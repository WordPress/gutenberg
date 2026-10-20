import { useSelect } from '@wordpress/data';
import {
	store as blocksStore,
	isReusableBlock,
	isTemplatePart,
	__experimentalGetBlockLabel as getBlockLabel,
} from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { symbol } from '@wordpress/icons';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import type { BlockEditorThunkArgs } from '../../store/types';
import type { BlockDisplayAttributes, BlockDisplayInformation } from './types';

/**
 * Get the display label for a block's position type.
 *
 * @param attributes Block attributes.
 * @return The position type label.
 */
export function getPositionTypeLabel(
	attributes: BlockDisplayAttributes | null
): string | null {
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
 * @return {?BlockDisplayInformation} Block's display information, or `null` when the block or its type not found.
 */

export default function useBlockDisplayInformation(
	clientId: string
): BlockDisplayInformation | null {
	return useSelect(
		( select ) => {
			if ( ! clientId ) {
				return null;
			}
			const blockEditorSelect = select( blockEditorStore );
			const {
				getBlockName,
				getBlockAttributes,
				getBlock,
				__experimentalGetParsedPattern,
			} = blockEditorSelect;
			const { getBlockType, getActiveBlockVariation } =
				select( blocksStore );
			// A missing block has no block type, which returns early below.
			const blockName = getBlockName( clientId )!;
			const blockType = getBlockType( blockName );
			if ( ! blockType ) {
				return null;
			}
			// Attributes are not validated against the block type's schema.
			const attributes = getBlockAttributes(
				clientId
			) as BlockDisplayAttributes;
			const { isSectionBlock } =
				unlock< BlockEditorThunkArgs[ 'select' ] >( blockEditorSelect );

			// Check if this block is a pattern
			const patternName = attributes?.metadata?.patternName;

			if ( patternName && isSectionBlock( clientId ) ) {
				const pattern = __experimentalGetParsedPattern( patternName );
				const positionLabel = getPositionTypeLabel( attributes );
				return {
					isSynced: false,
					title: __( 'Pattern' ),
					icon: symbol,
					description:
						pattern?.description || __( 'A block pattern.' ),
					anchor: attributes?.anchor,
					positionLabel,
					positionType: attributes?.style?.position?.type,
					name: pattern?.title || attributes?.metadata?.name,
				};
			}

			const match = getActiveBlockVariation(
				blockName,
				attributes,
				undefined,
				getBlock?.( clientId )?.innerContent
			);
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
