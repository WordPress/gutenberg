/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
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
	readOnly: true,
};

export default dateModifiedField;
