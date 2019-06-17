/**
 * External dependencies
 */
import moment from 'moment';
import memoize from 'memize';

/**
 * WordPress dependencies
 */
import {
	Disabled,
	ServerSideRender,
} from '@wordpress/components';
import { Component } from '@wordpress/element';
import { withSelect } from '@wordpress/data';

class CalendarEdit extends Component {
	constructor() {
		super( ...arguments );
		this.getYearMonth = memoize(
			this.getYearMonth.bind( this ),
			{ maxSize: 1 }
		);
		this.getServerSideAttributes = memoize(
			this.getServerSideAttributes.bind( this ),
			{ maxSize: 1 }
		);
	}

	getYearMonth( date ) {
		if ( ! date ) {
			return {};
		}
		const momentDate = moment( date );
		return {
			year: momentDate.year(),
			month: momentDate.month() + 1,
		};
	}

	getServerSideAttributes( attributes, date ) {
		return {
			...attributes,
			...this.getYearMonth( date ),
		};
	}

	render() {
		return (
			<Disabled>
				<ServerSideRender
					block="core/calendar"
					attributes={ this.getServerSideAttributes(
						this.props.attributes,
						this.props.date
					) }
				/>
			</Disabled>
		);
	}
}

export default withSelect( ( select ) => {
	const coreEditorSelect = select( 'core/editor' );
	if ( ! coreEditorSelect ) {
		return;
	}
	const {
		getEditedPostAttribute,
	} = coreEditorSelect;
	const postType = getEditedPostAttribute( 'type' );
	// Dates are used to overwrite year and month used on the calendar.
	// This overwrite should only happen for 'post' post types.
	// For other post types the calendar always displays the current month.
	return {
		date: postType === 'post' ?
			getEditedPostAttribute( 'date' ) :
			undefined,
	};
} )( CalendarEdit );
