/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';

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
		const { isDirty } = this.props;

		// We need to call the selector directly in the listener to avoid race
		// conditions with `BrowserURL` where `componentDidUpdate` gets the
		// new value of `isEditedPostDirty` before this component does,
		// causing this component to incorrectly think a trashed post is still dirty.
		if ( isDirty() ) {
			event.returnValue = __(
				'You have unsaved changes. If you proceed, they will be lost.'
			);
			return event.returnValue;
		}
	}

	render() {
		return null;
	}
}

export default UnsavedChangesWarning;
