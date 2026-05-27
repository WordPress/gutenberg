/**
 * WordPress dependencies
 */
import { Tooltip as WCTooltip } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { getFilename } from '@wordpress/url';
import type { DataViewRenderFieldProps } from '@wordpress/dataviews';
/**
 * Internal dependencies
 */
import type { MediaItem } from '../types';

// Proxy threshold for "long enough that the cell will visually truncate" —
// used to decide whether to wrap the filename in a Tooltip showing the full
// name on hover. Visual truncation itself is handled in CSS.
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

	if ( fileName.length <= TRUNCATE_LENGTH ) {
		return (
			<span className="dataviews-media-field__filename">
				{ fileName }
			</span>
		);
	}

	// `tabIndex={-1}` keeps the Tooltip anchor out of the keyboard tab order:
	// Ariakit's `useFocusable` (via TooltipAnchor) preserves an explicit
	// `tabIndex` on non-natively-focusable elements rather than defaulting it
	// to `0`. Hover-only reveal is intentional — the full filename text is
	// already in the DOM for assistive technology reading the row.
	return (
		<WCTooltip text={ fileName }>
			<span className="dataviews-media-field__filename" tabIndex={ -1 }>
				{ fileName }
			</span>
		</WCTooltip>
	);
}
