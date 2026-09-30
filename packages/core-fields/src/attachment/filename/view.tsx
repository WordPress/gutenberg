import { useMemo } from '@wordpress/element';
import { getFilename } from '@wordpress/url';
import { Tooltip } from '@wordpress/ui';
import type { MediaItem } from '../types';
import styles from './style.module.css';

// Proxy threshold for "long enough that the cell will visually truncate" —
// used to decide whether to wrap the filename in a Tooltip showing the full
// name on hover. Visual truncation itself is handled in CSS.
const TRUNCATE_LENGTH = 15;

/*
 * A copy of the file name view of `@wordpress/media-fields`, styled with a
 * CSS module.
 */
export default function FileNameView( { item }: { item: MediaItem } ) {
	const fileName = useMemo(
		() => ( item?.source_url ? getFilename( item.source_url ) : null ),
		[ item?.source_url ]
	);

	if ( ! fileName ) {
		return '';
	}

	if ( fileName.length <= TRUNCATE_LENGTH ) {
		return <span className={ styles.filename }>{ fileName }</span>;
	}

	// The full filename is always in the DOM, so assistive tech gets it
	// regardless. The Tooltip aids mouse users where the cell visually clips
	// (DataViews layouts); in a non-truncating context like the DataForm the
	// name wraps in full, making it redundant but harmless.
	return (
		<Tooltip.Root>
			<Tooltip.Trigger
				render={
					<span className={ styles.filename }>{ fileName }</span>
				}
			/>
			<Tooltip.Popup>{ fileName }</Tooltip.Popup>
		</Tooltip.Root>
	);
}
