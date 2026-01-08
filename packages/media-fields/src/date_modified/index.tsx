/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { getSettings } from '@wordpress/date';
import type { Field } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import type { MediaItem } from '../types';

const dateModifiedField: Partial< Field< MediaItem > > = {
	id: 'modified',
	type: 'datetime',
	label: __( 'Date modified' ),
	filterBy: {
		operators: [ 'before', 'after' ],
	},
	format: {
		datetime: getSettings().formats.datetimeAbbreviated,
	},
	readOnly: true,
};

export default dateModifiedField;
