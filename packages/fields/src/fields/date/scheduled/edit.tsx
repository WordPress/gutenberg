/**
 * WordPress dependencies
 */
// @ts-ignore
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import type { DataFormControlProps } from '@wordpress/dataviews';
import { getSettings } from '@wordpress/date';
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { BasePost } from '../../../types';
import { unlock } from '../../../lock-unlock';

const { PrivatePublishDateTimePicker } = unlock( blockEditorPrivateApis );

export default function ScheduledDateEdit( {
	data,
	field,
	onChange,
}: DataFormControlProps< BasePost > ) {
	const currentDate = field.getValue( { item: data } ) as string;

	const settings = getSettings();

	// To know if the current timezone is a 12 hour time with look for "a" in
	// the time format. We also make sure this "a" is not escaped by a "/".
	const is12HourTime = /a(?!\\)/i.test(
		settings.formats.time
			.toLowerCase()
			.replace( /\\\\/g, '' )
			.split( '' )
			.reverse()
			.join( '' )
	);

	return (
		<PrivatePublishDateTimePicker
			currentDate={ currentDate }
			onChange={ ( newDate: any ) => onChange( { date: newDate } ) }
			is12Hour={ is12HourTime }
			dateOrder={
				/* translators: Order of day, month, and year. Available formats are 'dmy', 'mdy', and 'ymd'. */
				_x( 'dmy', 'date order' )
			}
			isCompact
			showPopoverHeaderActions={ false }
		/>
	);
}
