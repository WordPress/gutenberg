/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { __experimentalGetSettings, gmdate } from '@wordpress/date';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { DateTimePicker } from '@wordpress/components';

export function PostSchedule( { date, onUpdateDate, postByMonth } ) {
	const onChange = ( newDate ) => {
		onUpdateDate( newDate );
		document.activeElement.blur();
	};

	const settings = __experimentalGetSettings();
	// To know if the current timezone is a 12 hour time with look for "a" in the time format
	// We also make sure this a is not escaped by a "/"
	const is12HourTime = /a(?!\\)/i.test(
		settings.formats.time
			.toLowerCase() // Test only the lower case a
			.replace( /\\\\/g, '' ) // Replace "//" with empty strings
			.split( '' )
			.reverse()
			.join( '' ) // Reverse the string and test for "a" not followed by a slash
	);

	return (
		<DateTimePicker
			key="date-time-picker"
			currentDate={ date }
			onChange={ onChange }
			is12Hour={ is12HourTime }
			events={ postByMonth }
		/>
	);
}

export default compose( [
	withSelect( ( select ) => {
		const now = new Date();

		const firstDayOfTheMonth = new Date(
			now.getFullYear(),
			now.getMonth(),
			1
		).toISOString();
		const lastDayOfTheMonth = new Date(
			now.getFullYear(),
			now.getMonth() + 1,
			1
		).toISOString();

		return {
			date: select( 'core/editor' ).getEditedPostAttribute( 'date' ),
			postByMonth: map(
				select( 'core' ).getEntityRecords( 'postType', 'post', {
					status: 'publish,future',
					after: firstDayOfTheMonth,
					before: lastDayOfTheMonth,
				} ),
				( { date, title } ) => ( {
					title,
					date: new Date( date ),
				} )
			),
		};
	} ),
	withDispatch( ( dispatch ) => {
		return {
			onUpdateDate( date ) {
				dispatch( 'core/editor' ).editPost( { date } );
			},
		};
	} ),
] )( PostSchedule );
