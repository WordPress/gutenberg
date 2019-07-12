/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { dateI18n, __experimentalGetSettings } from '@wordpress/date';
import { withSelect } from '@wordpress/data';

import { Component } from '@wordpress/element';

class PostScheduleLabel extends Component {
	render() {
		const settings = __experimentalGetSettings();

		if ( this.props.date && ! this.props.isFloating ) {
			return dateI18n( settings.formats.datetimeAbbreviated, this.props.date );
		}
		return __( 'Immediately' );
	}
}

export default withSelect( ( select ) => {
	return {
		date: select( 'core/editor' ).getEditedPostAttribute( 'date' ),
		isFloating: select( 'core/editor' ).isEditedPostDateFloating(),
		isScheduled: select( 'core/editor' ).isEditedPostBeingScheduled(),
	};
} )( PostScheduleLabel );
