/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import type { Field } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import type { MediaItem } from '../types';
import MediaThumbnailView from './view';

const mediaThumbnailField: Partial< Field< MediaItem > > = {
	id: 'media_thumbnail',
	type: 'media',
	label: __( 'Thumbnail' ),
	render: MediaThumbnailView,
	enableSorting: false,
	filterBy: false,
};

export default mediaThumbnailField;
