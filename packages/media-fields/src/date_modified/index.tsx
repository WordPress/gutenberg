/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { dateI18n, getDate, getSettings } from '@wordpress/date';
import type { Field } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import type { MediaItem } from '../types';

const getFormattedDate = ( dateToDisplay: string | null ) =>
	dateI18n(
		getSettings().formats.datetimeAbbreviated,
		getDate( dateToDisplay )
	);

const dateModifiedField: Partial< Field< MediaItem > > = {
	id: 'modified',
	type: 'datetime',
	label: __( 'Date modified' ),
	getValue: ( { item }: { item: MediaItem } ) =>
		item?.modified ? getFormattedDate( item.modified ) : '',
	filterBy: {
		operators: [ 'before', 'after' ],
	},
	readOnly: true,
};

export default dateModifiedField;
