/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { withSelect } from '@wordpress/data';

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

	/**
	 * Warns the user if there are unsaved changes before leaving the editor.
	 *
	 * @param {Event} event `beforeunload` event.
	 *
	 * @return {?string} Warning prompt message, if unsaved changes exist.
	 */
	warnIfUnsavedChanges( event ) {
		const { isEditedPostDirty } = this.props;

		if ( isEditedPostDirty() ) {
			event.returnValue = __( 'You have unsaved changes. If you proceed, they will be lost.' );
			return event.returnValue;
		}
	}

	render() {
		return null;
	}
}

export default withSelect( ( select ) => ( {
	// We need the function to avoid race conditions.
	isEditedPostDirty: select( 'core/editor' ).isEditedPostDirty,
} ) )( UnsavedChangesWarning );
