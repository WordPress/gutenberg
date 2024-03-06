/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	__experimentalGetBlockLabel as getBlockLabel,
	store as blocksStore,
} from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

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
			const label = getBlockLabel( blockType, attributes, context );
			// If the label is defined we prioritize it over a possible block variation title match.
			if ( label !== blockType.title ) {
				// Users can enter and save a label made of only spaces e.g. for
				// navigation links. In that case we provide a fallback label.
				// We do want to trim leading and trailing spaces anyways.
				const trimmedLabel = label.trim();
				return trimmedLabel === '' ? __( 'Untitled' ) : trimmedLabel;
			}

			const match = getActiveBlockVariation( blockName, attributes );
			// Label will fallback to the title if no label is defined for the current label context.
			return match?.title || blockType.title;
		},
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
