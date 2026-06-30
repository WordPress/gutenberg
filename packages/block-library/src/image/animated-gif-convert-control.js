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
 * Internal dependencies
 */
import { getCarriedGifConversionAttributes } from '../utils/gif-conversion-attributes';

/**
 * Toolbar control that turns an animated GIF Image block into a converted Video
 * block once the GIF's sideloaded video companion is available.
 *
 * Mirrors the Video block's "Display as GIF" toolbar control. Fresh uploads
 * are swapped automatically from the image block's `onSelectImage`; this
 * control is the explicit path for image blocks that came from saved post
 * content (or that the author restored from a converted Video block via
 * "Display as GIF") and now want to be played as a looping video.
 *
 * @param {Object} props            Component props.
 * @param {Object} props.attributes Image block attributes.
 * @param {string} props.clientId   Block client ID.
 *
 * @return {Component|null} The control, or null when conversion does not apply.
 */
export default function AnimatedGifConvertControl( { attributes, clientId } ) {
	const { id, url, caption } = attributes;
	const { replaceBlocks } = useDispatch( blockEditorStore );

	const companion = useSelect(
		( select ) => {
			if ( ! id ) {
				return null;
			}
			/*
			 * Only animated GIFs have a video companion. Gate on the `.gif`
			 * extension so an ordinary image never triggers an attachment
			 * REST fetch just to discover it has no companion. Strip any
			 * query string or fragment first so a URL like `cat.gif?ver=2`
			 * still matches.
			 */
			const urlPath = url?.split( /[?#]/ )[ 0 ];
			if ( ! urlPath?.toLowerCase().endsWith( '.gif' ) ) {
				return null;
			}
			// A gallery only accepts `core/image` children, so swapping the
			// image for a video block there would be rejected. Hide the
			// control inside a gallery; the converted video is still
			// sideloaded and stored for use elsewhere.
			const { getBlockRootClientId, getBlockName } =
				select( blockEditorStore );
			const rootClientId = getBlockRootClientId( clientId );
			if (
				rootClientId &&
				getBlockName( rootClientId ) === 'core/gallery'
			) {
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
				width: details.width,
				height: details.height,
			};
		},
		[ id, url, clientId ]
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
				...getCarriedGifConversionAttributes( attributes ),
				id,
				src: dir + companion.video,
				poster: companion.poster ? dir + companion.poster : undefined,
				caption,
				controls: false,
				loop: true,
				autoplay: true,
				muted: true,
				playsInline: true,
				// Carry the GIF's intrinsic dimensions so the <video> keeps its
				// aspect ratio from the first paint. Without them the element
				// collapses to the browser-default size and then jumps once the
				// poster/metadata load, which shows up as a brief duplicated
				// image during the swap.
				width: companion.width,
				height: companion.height,
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
