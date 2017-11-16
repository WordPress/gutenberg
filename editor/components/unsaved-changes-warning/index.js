/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { isEditedPostDirty } from '../../state/selectors';

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
		if ( this.props.isDirty ) {
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
	} )
)( UnsavedChangesWarning );
