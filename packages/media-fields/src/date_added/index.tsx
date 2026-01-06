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

const dateAddedField: Partial< Field< MediaItem > > = {
	id: 'date',
	type: 'datetime',
	label: __( 'Date added' ),
	getValue: ( { item }: { item: MediaItem } ) =>
		item?.date ? getFormattedDate( item.date ) : '',
	filterBy: {
		operators: [ 'before', 'after' ],
	},
	readOnly: true,
};

export default dateAddedField;
