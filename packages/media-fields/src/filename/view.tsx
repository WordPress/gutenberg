/**
 * WordPress dependencies
 */
import {
	Tooltip,
	__experimentalTruncate as Truncate,
} from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { getFilename } from '@wordpress/url';
import type { DataViewRenderFieldProps } from '@wordpress/dataviews';
/**
 * Internal dependencies
 */
import type { MediaItem } from '../types';

// Hard-coded truncate length to match the available area in the media sidebar.
// Longer file names will be truncated and wrapped in a tooltip showing the full name.
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

	return fileName.length > TRUNCATE_LENGTH ? (
		<Tooltip text={ fileName }>
			<Truncate limit={ TRUNCATE_LENGTH } ellipsizeMode="tail">
				{ fileName }
			</Truncate>
		</Tooltip>
	) : (
		<>{ fileName }</>
	);
}
