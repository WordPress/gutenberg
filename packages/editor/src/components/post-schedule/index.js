/**
 * WordPress dependencies
 */
import { __experimentalGetSettings } from '@wordpress/date';
import { withSelect, withDispatch, useSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { DateTimePicker } from '@wordpress/components';
import { useRef, useState } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

function getDayOfTheMonth( date = new Date(), firstDay = true ) {
	const d = new Date( date );
	return new Date(
		d.getFullYear(),
		d.getMonth() + ( firstDay ? 0 : 1 ),
		firstDay ? 1 : 0
	).toISOString();
}

export function PostSchedule( { date, onUpdateDate } ) {
	const [ currentMonth ] = useState( getDayOfTheMonth( date ) );

	// Pick up published and schduled site posts.
	const events = useSelect(
		( select ) => {
			const posts =
				select( editorStore ).getEntityRecords( 'postType', 'post', {
					status: 'publish,future',
					after: getDayOfTheMonth( currentMonth ),
					before: getDayOfTheMonth( currentMonth, false ),
				} ) || [];

			return posts.map( ( { title, type, postDate } ) => ( {
				title: title?.raw,
				type,
				date: new Date( postDate ),
			} ) );
		},
		[ currentMonth ]
	);

	const ref = useRef();
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

	function onChange( newDate ) {
		onUpdateDate( newDate );
		const { ownerDocument } = ref.current;
		ownerDocument.activeElement.blur();
	}

	return (
		<DateTimePicker
			ref={ ref }
			currentDate={ date }
			onChange={ onChange }
			is12Hour={ is12HourTime }
			events={ events }
		/>
	);
}

export default compose( [
	withSelect( ( select ) => {
		return {
			date: select( coreStore ).getEditedPostAttribute( 'date' ),
		};
	} ),
	withDispatch( ( dispatch ) => {
		return {
			onUpdateDate( date ) {
				dispatch( coreStore ).editPost( { date } );
			},
		};
	} ),
] )( PostSchedule );
