/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { createBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

// Image blocks that have already been auto-converted to a GIF video block.
// Undoing the conversion restores the original image block; tracking the
// client ID here keeps that undone state from being immediately re-converted.
const convertedClientIds = new Set();

/**
 * Switches an uploaded animated GIF Image block to the Video block's "GIF"
 * variation once its converted video companion is available.
 *
 * When client-side media processing converts an opaque animated GIF, the GIF
 * stays the image attachment and the converted video and poster are sideloaded
 * as companion files (exposed in `media_details.animated_video` /
 * `animated_video_poster`). This component watches for that companion and, for a
 * standalone Image block the author has not opted out of, replaces the block
 * with a muted, looping `core/video` block that plays like the GIF.
 *
 * Gallery images are left as images (a gallery only accepts image blocks), as
 * are images opted out via the "Display as original GIF" toggle.
 *
 * @param {Object}  props                       Component props.
 * @param {number}  props.id                    Image attachment ID.
 * @param {string}  props.clientId              Image block client ID.
 * @param {string}  [props.url]                 Image URL, used to detect a GIF.
 * @param {string}  [props.caption]             Image caption, carried to the video.
 * @param {number}  [props.galleryId]           Enclosing gallery ID, when nested.
 * @param {boolean} [props.preserveAnimatedGif] Whether the author opted out.
 *
 * @return {null} This component renders nothing.
 */
export default function AnimatedGifConverter( {
	id,
	clientId,
	url,
	caption,
	galleryId,
	preserveAnimatedGif,
} ) {
	const { replaceBlocks } = useDispatch( blockEditorStore );

	// Only GIFs can have a converted-video companion. Gate the attachment
	// fetch on the URL so non-GIF images never trigger a REST request.
	const isGifUrl = !! url && /\.gif(?:\?|#|$)/i.test( url );

	const companion = useSelect(
		( select ) => {
			if ( ! id || ! isGifUrl ) {
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
		[ id, isGifUrl ]
	);

	useEffect( () => {
		if (
			! companion ||
			galleryId ||
			preserveAnimatedGif ||
			convertedClientIds.has( clientId )
		) {
			return;
		}

		// Companion files are sideloaded next to the GIF, so they share its
		// directory; build their URLs from the GIF's own source URL.
		const dir = companion.sourceUrl.slice(
			0,
			companion.sourceUrl.lastIndexOf( '/' ) + 1
		);

		convertedClientIds.add( clientId );

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
	}, [
		companion,
		galleryId,
		preserveAnimatedGif,
		clientId,
		id,
		caption,
		replaceBlocks,
	] );

	return null;
}
