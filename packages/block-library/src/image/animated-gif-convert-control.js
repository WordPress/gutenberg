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
import { video as videoIcon } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Toolbar control that turns an animated GIF Image block into a converted Video
 * block once the GIF's sideloaded video companion is available.
 *
 * Mirrors the Video block's "Display as GIF" toolbar control: when the GIF was
 * uploaded earlier in the session it auto-swaps on render; this control is the
 * explicit path for image blocks that came in already opted out (for example
 * after using "Display as GIF" to restore the original) or that were saved
 * before the companion finished sideloading.
 *
 * @param {Object} props            Component props.
 * @param {Object} props.attributes Image block attributes.
 * @param {string} props.clientId   Block client ID.
 *
 * @return {Component|null} The control, or null when conversion does not apply.
 */
export default function AnimatedGifConvertControl( { attributes, clientId } ) {
	const { id, caption } = attributes;
	const { replaceBlocks } = useDispatch( blockEditorStore );

	const companion = useSelect(
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
			const details = record?.media_details;
			if ( ! details?.animated_video || ! record?.source_url ) {
				return null;
			}
			return {
				sourceUrl: record.source_url,
				video: details.animated_video,
				poster: details.animated_video_poster,
			};
		},
		[ id ]
	);

	if ( ! companion ) {
		return null;
	}

	function convertToVideo() {
		// Companion files are sideloaded next to the GIF, so they share its
		// directory; build their URLs from the GIF's own source URL.
		const dir = companion.sourceUrl.slice(
			0,
			companion.sourceUrl.lastIndexOf( '/' ) + 1
		);

		replaceBlocks(
			clientId,
			createBlock( 'core/video', {
				id,
				src: dir + companion.video,
				poster: companion.poster ? dir + companion.poster : undefined,
				caption,
				controls: false,
				loop: true,
				autoplay: true,
				muted: true,
				playsInline: true,
			} )
		);
	}

	return (
		<BlockControls group="other">
			<ToolbarGroup>
				<ToolbarButton icon={ videoIcon } onClick={ convertToVideo }>
					{ __( 'Display as video' ) }
				</ToolbarButton>
			</ToolbarGroup>
		</BlockControls>
	);
}
