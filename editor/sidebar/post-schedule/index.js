/**
 * External dependencies
 */
import { connect } from 'react-redux';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import { flowRight } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { dateI18n, settings } from '@wordpress/date';
import { PanelRow, Dropdown, withAPIData } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import PostScheduleClock from './clock';
import { getEditedPostAttribute } from '../../selectors';
import { editPost } from '../../actions';

export function PostSchedule( { date, onUpdateDate, user } ) {
	if ( ! user.data || ! user.data.capabilities.publish_posts ) {
		return null;
	}

	const momentDate = date ? moment( date ) : moment();
	const label = date
		? dateI18n( settings.formats.datetime, date )
		: __( 'Immediately' );
	const handleChange = ( newDate ) => {
		onUpdateDate( newDate.format( 'YYYY-MM-DDTHH:mm:ss' ) );
	};

		// To know if the current timezone is a 12 hour time with look for "a" in the time format
		// We also make sure this a is not escaped by a "/"
	const is12HourTime = /a(?!\\)/i.test(
		settings.formats.time
			.toLowerCase() // Test only the lower case a
			.replace( /\\\\/g, '' ) // Replace "//" with empty strings
			.split( '' ).reverse().join( '' ) // Reverse the string and test for "a" not followed by a slash
	);

	return (
		<PanelRow className="editor-post-schedule">
			<span>{ __( 'Publish' ) }</span>
			<Dropdown
				position="bottom left"
				contentClassName="editor-post-schedule__dialog"
				renderToggle={ ( { onToggle, isOpen } ) => (
					<button
						type="button"
						className="editor-post-schedule__toggle button-link"
						onClick={ onToggle }
						aria-expanded={ isOpen }
					>
						{ label }
					</button>
				) }
				renderContent={ () => ( [
					<DatePicker
						key="date-picker"
						inline
						selected={ momentDate }
						onChange={ handleChange }
						locale={ settings.l10n.locale }
					/>,
					<PostScheduleClock
						key="clock"
						selected={ momentDate }
						onChange={ handleChange }
						is12Hour={ is12HourTime }
					/>,
				] ) }
			/>
		</PanelRow>
	);
}

const applyConnect = connect(
	( state ) => {
		return {
			date: getEditedPostAttribute( state, 'date' ),
		};
	},
	( dispatch ) => {
		return {
			onUpdateDate( date ) {
				dispatch( editPost( { date } ) );
			},
		};
	}
);

const applyWithAPIData = withAPIData( () => {
	return {
		user: '/wp/v2/users/me?context=edit',
	};
} );

export default flowRight(
	applyConnect,
	applyWithAPIData
)( PostSchedule );
