/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import type { Field } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import type { MediaItem } from '../types';

const dateAddedField: Partial< Field< MediaItem > > = {
	id: 'date',
	type: 'datetime',
	label: __( 'Date added' ),
	filterBy: {
		operators: [ 'before', 'after' ],
	},
	readOnly: true,
};

export default dateAddedField;
