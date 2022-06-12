/**
 * WordPress dependencies
 */
import { sprintf, __ } from '@wordpress/i18n';
import { getBlockType } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';

export function useBlockScreenReaderDescription( clientId ) {
	const { hasChildBlocks, blockTitle, canSupportChildBlocks } = useSelect(
		( select ) => {
			const {
				getBlockRootClientId,
				getBlockName,
				getBlock,
				getBlockListSettings,
			} = select( blockEditorStore );
			const clientIdToUse = getBlockRootClientId( clientId );
			const blockName = getBlockName(
				clientIdToUse ? clientIdToUse : clientId
			);
			const blockType = getBlockType( blockName );
			return {
				hasChildBlocks:
					getBlock( clientIdToUse ? clientIdToUse : clientId )
						?.innerBlocks?.length > 0,
				blockTitle: blockType?.title,
				canSupportChildBlocks: getBlockListSettings(
					clientIdToUse ? clientIdToUse : clientId
				),
			};
		},
		[ clientId ]
	);
	let description;
	if ( canSupportChildBlocks ) {
		if ( hasChildBlocks ) {
			description = sprintf(
				// Translators: 1: The block title to lowercase for good sentence structure.
				__( 'Press Escape key to navigate child blocks of %1$s.' ),
				blockTitle.toLowerCase()
			);
		} else {
			description = sprintf(
				// Translators: 1: The block title to lowercase for good sentence structure.
				__(
					'Press Tab followed by Enter keys to add a child block to %s.'
				),
				blockTitle.toLowerCase()
			);
		}
	}
	return description;
}
