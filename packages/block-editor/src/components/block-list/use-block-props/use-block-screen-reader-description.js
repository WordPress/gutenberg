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
	const { hasChildBlocks, blockTitle } = useSelect(
		( select ) => {
			const { getBlockRootClientId, getBlockName, getBlock } = select(
				blockEditorStore
			);
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
			};
		},
		[ clientId ]
	);
	let description;
	if ( hasChildBlocks ) {
		description = sprintf(
			// Translators: 1: The block title to lowercase for good sentence structure.
			__( 'Child block of %1$s.' ),
			blockTitle.toLowerCase()
		);
	} else {
		description = __( 'Testing non-child block description.' );
	}
	return description;
}
