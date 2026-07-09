/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Returns the subset of block attributes that should be carried over when
 * converting between the animated-GIF Image block and its converted Video
 * block (in either direction).
 *
 * The conversion swaps one block for another via `createBlock`, which would
 * otherwise drop everything the author set on the original block. This carries
 * the attributes both blocks support, so the conversion (and its reverse) keeps
 * them: block alignment, the HTML anchor, custom class names, and margin
 * spacing.
 *
 * Image-only attributes such as links (`href`/`linkDestination`), sizing
 * (`sizeSlug`/`scale`), and `border`/`shadow` styles are intentionally not
 * carried: the Video block has no equivalent, so copying them would leave
 * attributes the target block cannot represent.
 *
 * @param {Object} attributes Source block attributes.
 * @return {Object} Attributes to spread into the converted block.
 */
export function getCarriedGifConversionAttributes( attributes ) {
	const { align, anchor, className, style } = attributes;
	const margin = style?.spacing?.margin;

	return {
		...( align && { align } ),
		...( anchor && { anchor } ),
		...( className && { className } ),
		...( margin && { style: { spacing: { margin } } } ),
	};
}

/**
 * Returns the sideloaded video companion of an animated GIF image attachment,
 * or `null` when the media is not a converted animated GIF.
 *
 * An animated GIF uploaded through the editor gets a muted, looping video
 * transcode sideloaded next to it and recorded (as basenames) in the
 * attachment's `media_details.animated_video` / `animated_video_poster`.
 *
 * Block transforms match and run synchronously, so this reads the attachment
 * record straight from the core-data store: it only returns the companion once
 * the record is resolved. The Image block resolves the record while the block
 * is selected, which is also when the block switcher can offer the transform.
 *
 * @param {number} id  Image attachment ID.
 * @param {string} url Image block URL, used to cheaply skip non-GIF media.
 * @return {Object|null} Companion details (absolute `src`/`poster` URLs and
 *                       the GIF's intrinsic `width`/`height`), or `null`.
 */
export function getAnimatedGifVideoCompanion( id, url ) {
	if ( ! id ) {
		return null;
	}
	/*
	 * Only animated GIFs have a video companion. Gate on the `.gif` extension
	 * so an ordinary image never reaches into the attachment record just to
	 * discover it has no companion. Strip any query string or fragment first
	 * so a URL like `cat.gif?ver=2` still matches.
	 */
	const urlPath = url?.split( /[?#]/ )[ 0 ];
	if ( ! urlPath?.toLowerCase().endsWith( '.gif' ) ) {
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
	// Companion files are sideloaded next to the GIF, so they share its
	// directory; build their URLs from the GIF's own source URL.
	const dir = record.source_url.slice(
		0,
		record.source_url.lastIndexOf( '/' ) + 1
	);
	return {
		src: dir + details.animated_video,
		poster: details.animated_video_poster
			? dir + details.animated_video_poster
			: undefined,
		width: details.width,
		height: details.height,
	};
}

/**
 * Returns the original GIF image attachment behind a converted GIF video
 * block, or `null` when the block's media is not an image attachment.
 *
 * A converted GIF video block keeps the GIF image attachment as its `id`, so
 * an image mime type is what distinguishes it from a regular video that merely
 * loops and autoplays. Like {@link getAnimatedGifVideoCompanion} this reads
 * the already-resolved attachment record synchronously for use in block
 * transforms; the Video block resolves the record while a GIF-behaving video
 * is selected.
 *
 * @param {number} id Attachment ID stored on the Video block.
 * @return {Object|null} The GIF attachment record, or `null`.
 */
export function getConvertedGifAttachment( id ) {
	if ( ! id ) {
		return null;
	}
	const record = select( coreStore ).getEntityRecord(
		'postType',
		'attachment',
		id,
		{ context: 'view' }
	);
	if ( ! record?.mime_type?.startsWith( 'image/' ) || ! record?.source_url ) {
		return null;
	}
	return record;
}
