/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import type { Attachment, Updatable } from '@wordpress/core-data';
import type { Field } from '@wordpress/dataviews';

const mimeTypeField: Partial< Field< Updatable< Attachment > > > = {
	id: 'mime_type',
	type: 'text',
	label: __( 'File type' ),
	getValue: ( { item } ) => item?.mime_type || '',
	render: ( { item } ) => item?.mime_type || '-',
	enableSorting: true,
	filterBy: false,
	readOnly: true,
};

export default mimeTypeField;
