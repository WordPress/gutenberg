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
		const momentDate = date ? moment( date + '+0000', 'YYYY-MM-DDTHH:mm:ssZ' ) : date;
		const label = momentDate
			? momentDate.format( 'LL, LT' )
			: __( 'Immediately' );
		const handleChange = ( newDate ) => {
			onUpdateDate( newDate.utc( 0 ).format() );
		};
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
						/>
						<PostScheduleClock
							selected={ momentDate }
							onChange={ handleChange }
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
			date: getEditedPostAttribute( state, 'date_gmt' ),
		};
	},
	( dispatch ) => {
		return {
			onUpdateDate( dateGmt ) {
				dispatch( editPost( { date_gmt: dateGmt } ) );
			},
		};
	}
)( clickOutside( PostSchedule ) );
