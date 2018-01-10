/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { some } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { isEditedPostDirty, getMetaBoxes } from '../../store/selectors';
import { getLocationHtml } from '../../edit-post/meta-boxes';

class UnsavedChangesWarning extends Component {
	constructor() {
		super( ...arguments );
		this.warnIfUnsavedChanges = this.warnIfUnsavedChanges.bind( this );
	}

	componentDidMount() {
		window.addEventListener( 'beforeunload', this.warnIfUnsavedChanges );
	}

	componentWillUnmount() {
		window.removeEventListener( 'beforeunload', this.warnIfUnsavedChanges );
	}

	warnIfUnsavedChanges( event ) {
		const areMetaBoxesDirty = some( this.props.metaBoxes, ( metaBoxe, location ) => {
			return metaBoxe.isActive && getLocationHtml( location ) !== metaBoxe.html;
		} );
		if ( this.props.isDirty || areMetaBoxesDirty ) {
			event.returnValue = __( 'You have unsaved changes. If you proceed, they will be lost.' );
			return event.returnValue;
		}
	}

	render() {
		return null;
	}
}

export default connect(
	( state ) => ( {
		isDirty: isEditedPostDirty( state ),
		metaBoxes: getMetaBoxes( state ),
	} )
)( UnsavedChangesWarning );
