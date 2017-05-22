/**
 * External dependencies
 */
import { connect } from 'react-redux';
import clickOutside from 'react-click-outside';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { Component } from 'element';
import { dateI18n, settings } from 'date';

/**
 * Internal dependencies
 */
import './style.scss';
import PostScheduleClock from './clock';
import { getEditedPostAttribute } from '../../selectors';
import { editPost } from '../../actions';

class PostSchedule extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			open: false,
		};
		this.toggleDialog = this.toggleDialog.bind( this );
	}

	toggleDialog( event ) {
		event.preventDefault();
		this.setState( { opened: ! this.state.opened } );
	}

	handleClickOutside() {
		this.setState( { opened: false } );
	}

	render() {
		const { date, onUpdateDate } = this.props;
		const momentDate = date ? moment( date ) : date;
		const label = momentDate
			? dateI18n( settings.formats.datetime, date )
			: __( 'Immediately' );
		const handleChange = ( newDate ) => {
			onUpdateDate( newDate.format( 'YYYY-MM-DDTHH:mm:ss' ) );
		};
		const is12HourTime = settings.formats.time.indexOf( 'a' ) !== -1 || settings.formats.time.indexOf( 'A' ) !== -1;
		return (
			<div className="editor-post-schedule">
				<span>{ __( 'Publish' ) }</span>
				<button className="editor-post-schedule__toggle button-link" onClick={ this.toggleDialog }>
					{ label }
				</button>

				{ this.state.opened &&
					<div className="editor-post-schedule__dialog">
						<div className="editor-post-schedule__dialog-arrow" />
						<DatePicker
							inline
							selected={ momentDate }
							onChange={ handleChange }
							locale={ settings.l10n.locale }
						/>
						<PostScheduleClock
							selected={ momentDate }
							onChange={ handleChange }
							is12Hour={ is12HourTime }
						/>
					</div>
				}
			</div>
		);
	}
}

export default connect(
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
)( clickOutside( PostSchedule ) );
