/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { getFilename } from '@wordpress/url';
import type { DataViewRenderFieldProps } from '@wordpress/dataviews';
/**
 * Internal dependencies
 */
import type { MediaItem } from '../types';

// Proxy threshold for "long enough that the cell will visually truncate" —
// used to decide whether to expose the full filename via the native `title`
// attribute. Visual truncation itself is handled in CSS.
const TRUNCATE_LENGTH = 15;

export default function FileNameView( {
	item,
}: DataViewRenderFieldProps< MediaItem > ) {
	const fileName = useMemo(
		() => ( item?.source_url ? getFilename( item.source_url ) : null ),
		[ item?.source_url ]
	);

	if ( ! fileName ) {
		return '';
	}

	const isTruncated = fileName.length > TRUNCATE_LENGTH;

	return (
		<span
			className="dataviews-media-field__filename"
			title={ isTruncated ? fileName : undefined }
		>
			{ fileName }
		</span>
	);
}
