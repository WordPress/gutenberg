import { __ } from '@wordpress/i18n';
import { getFilename } from '@wordpress/url';

// Matches common camera/phone/screenshot naming patterns, e.g. "IMG_1234",
// "DSC_0042", "Screenshot 2024-05-01". Requires at least one trailing digit
// so a bare word like "image" falls through to the generic-word check below
// instead of being treated as a file name.
const FILENAME_LIKE_PATTERN =
	/^(img|dsc|dscn|photo|picture|image|screenshot)[-_ ]?[\d-]+$/i;

const GENERIC_ALT_WORDS = [ 'image', 'photo', 'picture', 'graphic', 'img' ];

// Below this, longer alt text is still reasonable; above it, the text is
// likely better placed in the page content itself. There's no hard limit
// from any spec, so this is a soft usability threshold.
const MAX_RECOMMENDED_ALT_LENGTH = 150;

/**
 * Computes an accessibility warning for an image's alt text, if any.
 *
 * Checks, in priority order:
 * 1. A linked image with no alt text (the link has no accessible name).
 * 2. Alt text that looks like a file name (e.g. "IMG_1234" or the actual
 *    file name of the selected image).
 * 3. Alt text that is only a generic word like "image" or "photo".
 * 4. Alt text that duplicates the caption.
 * 5. Alt text that is unusually long.
 *
 * @param {Object}  props
 * @param {string}  [props.alt]      The image's alt attribute.
 * @param {string}  [props.caption]  The image's caption, as plain text.
 * @param {string}  [props.url]      The image's URL, used to derive its file name.
 * @param {boolean} [props.isLinked] Whether the image links to something.
 *
 * @return {?Object} `{ message }` when there's a warning, otherwise `null`.
 */
export function getAltTextWarning( { alt, caption, url, isLinked } ) {
	const trimmedAlt = ( alt || '' ).trim();

	if ( isLinked && ! trimmedAlt ) {
		return {
			message: __(
				'Linked images should have an alt attribute that describes the link target.'
			),
		};
	}

	if ( ! trimmedAlt ) {
		return null;
	}

	const normalizedAlt = trimmedAlt.toLowerCase();
	const filename = url ? getFilename( url ) : '';
	const filenameWithoutExtension = filename
		? filename.replace( /\.[^.]+$/, '' )
		: '';

	if (
		FILENAME_LIKE_PATTERN.test( trimmedAlt ) ||
		( filenameWithoutExtension &&
			normalizedAlt === filenameWithoutExtension.toLowerCase() )
	) {
		return {
			message: __(
				'The alt attribute is an image file name, which is not meaningful for users of assistive technology.'
			),
		};
	}

	if ( GENERIC_ALT_WORDS.includes( normalizedAlt ) ) {
		return {
			message: __(
				'This alt attribute does not meaningfully describe the image. Is this a decorative image?'
			),
		};
	}

	const trimmedCaption = ( caption || '' ).trim();
	if ( trimmedCaption && trimmedCaption.toLowerCase() === normalizedAlt ) {
		return {
			message: __(
				'The caption and alt attribute are the same for this image. The alt attribute should describe what the image looks like, while the caption provides additional context.'
			),
		};
	}

	if ( trimmedAlt.length > MAX_RECOMMENDED_ALT_LENGTH ) {
		return {
			message: __(
				'Your alternative text is very long. It may be better to add this text in the page content.'
			),
		};
	}

	return null;
}
