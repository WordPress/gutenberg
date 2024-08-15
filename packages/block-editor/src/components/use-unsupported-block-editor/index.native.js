/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { serialize } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

// Blocks that can't be edited through the Unsupported block editor identified by their name.
const UBE_INCOMPATIBLE_BLOCKS = [ 'core/block' ];

/**
 * Hook that retrieves the settings to determine if the
 * Unsupported Block Editor can be used in a specific block.
 *
 * @param {string} clientId Client ID of block.
 * @return {Object} Unsupported block editor settings.
 */
export default function useUnsupportedBlockEditor( clientId ) {
	return useSelect(
		( select ) => {
			const { getBlock, getSettings } = select( blockEditorStore );
			const { capabilities } = getSettings();

			const block = getBlock( clientId );
			const blockAttributes = block?.attributes || {};

			const blockDetails = {
				blockName: block?.name,
				blockContent: serialize( block ? [ block ] : [] ),
			};

			// If the block is unsupported, use the `original` attributes to identify the block's name.
			if ( blockDetails.blockName === 'core/missing' ) {
				blockDetails.blockName = blockAttributes.originalName;
				blockDetails.blockContent =
					blockDetails.blockName === 'core/freeform'
						? blockAttributes.content
						: block?.originalContent;
			}

			return {
				isUnsupportedBlockEditorSupported:
					capabilities?.unsupportedBlockEditor === true,
				canEnableUnsupportedBlockEditor:
					capabilities?.canEnableUnsupportedBlockEditor === true,
				isEditableInUnsupportedBlockEditor:
					! UBE_INCOMPATIBLE_BLOCKS.includes(
						blockDetails.blockName
					),
				...blockDetails,
			};
		},
		[ clientId ]
	);
}
