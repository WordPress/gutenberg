/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { getFilename } from '@wordpress/url';
import type { Field } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import type { MediaItem } from '../types';
import FileNameView from './view';

const filenameField: Partial< Field< MediaItem > > = {
	id: 'filename',
	type: 'text',
	label: __( 'File name' ),
	getValue: ( { item }: { item: MediaItem } ) =>
		getFilename( item?.source_url || '' ),
	render: FileNameView,
	enableSorting: false,
	filterBy: false,
	readOnly: true,
};

export default filenameField;
