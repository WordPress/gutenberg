/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { __experimentalGetSettings } from '@wordpress/date';
import { useSelect, useDispatch } from '@wordpress/data';
import { DateTimePicker } from '@wordpress/components';
import { useState } from '@wordpress/element';

function getDayOfTheMonth( date = new Date(), firstDay = true ) {
	const d = new Date( date );
	return new Date(
		d.getFullYear(),
		d.getMonth() + ( firstDay ? 0 : 1 ),
		firstDay ? 1 : 0
	).toISOString();
}

export function PostSchedule() {
	const postDate = useSelect(
		( select ) => select( 'core/editor' ).getEditedPostAttribute( 'date' ),
		[]
	);

	const [ currentMonth, setCurrentMonth ] = useState(
		getDayOfTheMonth( postDate )
	);

	const setCurrentMonthHandler = ( date ) => {
		setCurrentMonth( getDayOfTheMonth( date ) );
	};

	/*
	 * Pick up published and schduled post from site,
	 * and populate the `events` array.
	 */
	const events = useSelect(
		( select ) =>
			map(
				select( 'core' ).getEntityRecords( 'postType', 'post', {
					status: 'publish,future',
					after: getDayOfTheMonth( currentMonth ),
					before: getDayOfTheMonth( currentMonth, false ),
					per_page: 4,
				} ),
				( { title, type, date } ) => ( {
					title: title?.raw ? title.raw : title,
					type,
					date: new Date( date ),
				} )
			),
		[ currentMonth ]
	);

	// Update post date handler.
	const { editPost } = useDispatch( 'core/editor' );
	const updatePostDate = ( date ) => {
		editPost( { date } );
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
			currentDate={ postDate }
			onChange={ updatePostDate }
			onMonthChange={ setCurrentMonthHandler }
			is12Hour={ is12HourTime }
			events={ events }
		/>
	);
}

export default PostSchedule;
