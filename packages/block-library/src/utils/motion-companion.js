/**
 * An image can carry motion that the image itself cannot store: an animated
 * GIF converted for the front end, or a HEIC/HEIF image sequence — an Apple
 * Live Photo or Android burst — whose still frame became the attachment.
 *
 * In both cases the motion is uploaded as a video *companion file* of the
 * image attachment rather than as a second media library item, and recorded by
 * basename in `media_details.animated_video` (plus `animated_video_poster` for
 * a GIF, which needs a still frame generated for it; a sequence's attachment
 * is already its own first frame).
 *
 * These helpers turn a resolved attachment record into the URLs a Video block
 * needs, so the GIF transform and the Live photo conversion agree on how a
 * companion is found and addressed.
 */

/**
 * Returns the subset of Image block attributes to carry over when converting
 * to the Video block that plays its motion companion.
 *
 * The conversion swaps one block for another via `createBlock`, which would
 * otherwise drop everything the author set on the original block. This carries
 * the attributes both blocks support: block alignment, the HTML anchor, custom
 * class names, and margin spacing.
 *
 * Image-only attributes such as links (`href`/`linkDestination`), sizing
 * (`sizeSlug`/`scale`), and `border`/`shadow` styles are intentionally not
 * carried: the Video block has no equivalent, so copying them would leave
 * attributes the target block cannot represent.
 *
 * @param {Object} attributes Source block attributes.
 * @return {Object} Attributes to spread into the converted block.
 */
export function getCarriedMotionConversionAttributes( attributes ) {
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
 * Reads an attachment record's motion companion.
 *
 * @param {Object} record Resolved attachment record.
 * @return {Object|null} Absolute `src`/`poster` URLs and the image's intrinsic
 *                       `width`/`height`, or `null` when there is no companion.
 */
export function getMotionCompanion( record ) {
	const details = record?.media_details;
	if ( ! details?.animated_video || ! record?.source_url ) {
		return null;
	}

	// Companion files are sideloaded next to the image, so they share its
	// directory; build their URLs from the image's own source URL.
	const dir = record.source_url.slice(
		0,
		record.source_url.lastIndexOf( '/' ) + 1
	);

	return {
		src: dir + details.animated_video,
		/*
		 * A GIF gets a generated first-frame poster; a converted sequence has
		 * none, because the attachment it belongs to is that first frame.
		 */
		poster: details.animated_video_poster
			? dir + details.animated_video_poster
			: record.source_url,
		width: details.width,
		height: details.height,
	};
}

/**
 * Whether an attachment is a converted image sequence rather than a GIF.
 *
 * Both kinds carry the same companion metadata, so the parent's own type is
 * what tells them apart: a GIF stays a GIF, while a sequence was replaced by a
 * still frame in whatever format the editor produced.
 *
 * @param {Object} record Resolved attachment record.
 * @return {boolean} Whether the record describes a converted image sequence.
 */
export function isConvertedImageSequence( record ) {
	return (
		!! record?.media_details?.animated_video &&
		record?.mime_type !== 'image/gif'
	);
}
