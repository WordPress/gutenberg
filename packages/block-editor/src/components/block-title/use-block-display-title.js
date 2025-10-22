/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	__experimentalGetBlockLabel as getBlockLabel,
	store as blocksStore,
} from '@wordpress/blocks';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { PrivateBlockContext } from '../block-list/private-block-context';

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
	// Try to get blockType from context to avoid subscription when available
	const privateContext = useContext( PrivateBlockContext );
	const contextClientId = privateContext?.clientId;
	const contextBlockType = privateContext?.blockType;

	const shouldUseContext = contextClientId === clientId;

	const blockTitle = useSelect(
		( select ) => {
			if ( ! clientId ) {
				return null;
			}

			// Use context blockType if querying the current block
			let blockName, blockType;
			if ( shouldUseContext ) {
				blockName = privateContext?.name;
				blockType = contextBlockType;
			} else {
				const { getBlockName } = select( blockEditorStore );
				const { getBlockType } = select( blocksStore );
				blockName = getBlockName( clientId );
				blockType = getBlockType( blockName );
			}

			if ( ! blockType ) {
				return null;
			}

			const { getBlockAttributes } = select( blockEditorStore );
			const attributes = getBlockAttributes( clientId );
			const label = getBlockLabel( blockType, attributes, context );
			// If the label is defined we prioritize it over a possible block variation title match.
			if ( label !== blockType.title ) {
				return label;
			}

			const { getActiveBlockVariation } = select( blocksStore );
			const match = getActiveBlockVariation( blockName, attributes );
			// Label will fallback to the title if no label is defined for the current label context.
			return match?.title || blockType.title;
		},
		[ clientId, context, shouldUseContext ]
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
