/**
 * WordPress dependencies
 */
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import {
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { createBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { image as imageIcon } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getCarriedGifConversionAttributes } from '../utils/gif-conversion-attributes';

/**
 * Toolbar control that turns a converted GIF video block back into the original
 * animated GIF Image block.
 *
 * An animated GIF uploaded through the editor is converted to a muted, looping
 * video and presented as the Video block's "GIF" variation, while the original
 * GIF stays the underlying image attachment. This control switches the block
 * back to a `core/image` pointing at that GIF and opts the image out of being
 * re-converted.
 *
 * It only renders when the block's media is an image attachment (i.e. an
 * editor-converted GIF), so it never appears on regular videos that happen to
 * be muted and looping.
 *
 * @param {Object} props            Component props.
 * @param {Object} props.attributes Video block attributes.
 * @param {string} props.clientId   Block client ID.
 *
 * @return {Component|null} The control, or null when restoring does not apply.
 */
export default function GifRestoreControl( { attributes, clientId } ) {
	const { id, caption } = attributes;
	const { replaceBlocks } = useDispatch( blockEditorStore );

	// The original GIF is the underlying image attachment. Only offer the
	// restore when the media resolves to an image (an editor-converted GIF),
	// not when a regular video has simply been set to loop/autoplay/mute.
	const gif = useSelect(
		( select ) => {
			if ( ! id ) {
				return null;
			}
			const record = select( coreStore ).getEntityRecord(
				'postType',
				'attachment',
				id,
				{ context: 'view' }
			);
			if ( ! record?.mime_type?.startsWith( 'image/' ) ) {
				return null;
			}
			return record;
		},
		[ id ]
	);

	if ( ! gif?.source_url ) {
		return null;
	}

	function restoreToImage() {
		replaceBlocks(
			clientId,
			createBlock( 'core/image', {
				...getCarriedGifConversionAttributes( attributes ),
				id,
				url: gif.source_url,
				alt: gif.alt_text || '',
				caption,
			} )
		);
	}

	return (
		<BlockControls group="other">
			<ToolbarGroup>
				<ToolbarButton icon={ imageIcon } onClick={ restoreToImage }>
					{ __( 'Display as GIF' ) }
				</ToolbarButton>
			</ToolbarGroup>
		</BlockControls>
	);
}
