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
	return {
		date: select( 'core/editor' ).getEditedPostAttribute( 'date' ),
	};
} )( CalendarEdit );
