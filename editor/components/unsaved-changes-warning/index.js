/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { some } from 'lodash';
import jQuery from 'jquery';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { isEditedPostDirty, getMetaBoxes } from '../../store/selectors';
import { getMetaBoxContainer } from '../../utils/meta-boxes';

class UnsavedChangesWarning extends Component {
	/**
	 * @inheritdoc
	 */
	constructor() {
		super( ...arguments );
		this.warnIfUnsavedChanges = this.warnIfUnsavedChanges.bind( this );
	}

	/**
	 * @inheritdoc
	 */
	componentDidMount() {
		window.addEventListener( 'beforeunload', this.warnIfUnsavedChanges );
	}

	/**
	 * @inheritdoc
	 */
	componentWillUnmount() {
		window.removeEventListener( 'beforeunload', this.warnIfUnsavedChanges );
	}

	/**
	 * Warns the user if there are unsaved changes before leaving the editor.
	 *
	 * @param   {Event}   event Event Object.
	 * @return {string?}       Warning message.
	 */
	warnIfUnsavedChanges( event ) {
		const areMetaBoxesDirty = some( this.props.metaBoxes, ( metaBox, location ) => {
			return metaBox.isActive &&
				jQuery( getMetaBoxContainer( location ) ).serialize() !== metaBox.data;
		} );
		if ( this.props.isDirty || areMetaBoxesDirty ) {
			event.returnValue = __( 'You have unsaved changes. If you proceed, they will be lost.' );
			return event.returnValue;
		}
	}

	/**
	 * @inheritdoc
	 */
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
