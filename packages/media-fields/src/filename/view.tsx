/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { getFilename } from '@wordpress/url';
import type { DataViewRenderFieldProps } from '@wordpress/dataviews';
// eslint-disable-next-line @wordpress/use-recommended-components -- `Tooltip` is not yet on the recommended `@wordpress/ui` allow-list; landing as a migration step ahead of the wider rollout.
import { Tooltip } from '@wordpress/ui';

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

	// The Tooltip exposes the full filename on hover when the cell is
	// visually truncated by CSS (see `TRUNCATE_LENGTH` above). No extra AT
	// plumbing is needed — the full filename is already in the DOM inside
	// the `<span>`, so assistive technology reading the row gets the
	// complete name.
	return (
		<Tooltip.Root>
			<Tooltip.Trigger
				render={
					<span className="dataviews-media-field__filename">
						{ fileName }
					</span>
				}
			/>
			<Tooltip.Popup>{ fileName }</Tooltip.Popup>
		</Tooltip.Root>
	);
}
