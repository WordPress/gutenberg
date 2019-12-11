/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, ClipboardButton } from '@wordpress/components';
import { select } from '@wordpress/data';
import { Warning } from '@wordpress/block-editor';

class ErrorBoundary extends Component {
	constructor() {
		super( ...arguments );

		this.reboot = this.reboot.bind( this );
		this.getContent = this.getContent.bind( this );

		this.state = {
			error: null,
		};
	}

	componentDidCatch( error ) {
		this.setState( { error } );
	}

	reboot() {
		this.props.onError();
	}

	getContent() {
		try {
			// While `select` in a component is generally discouraged, it is
			// used here because it (a) reduces the chance of data loss in the
			// case of additional errors by performing a direct retrieval and
			// (b) avoids the performance cost associated with unnecessary
			// content serialization throughout the lifetime of a non-erroring
			// application.
			return select( 'core/editor' ).getEditedPostContent();
		} catch ( error ) {}
	}

	render() {
		const { error } = this.state;
		if ( ! error ) {
			return this.props.children;
		}

		return (
			<Warning
				className="editor-error-boundary"
				actions={ [
					<Button key="recovery" onClick={ this.reboot } isSecondary>
						{ __( 'Attempt Recovery' ) }
					</Button>,
					<ClipboardButton key="copy-post" text={ this.getContent } isSecondary>
						{ __( 'Copy Post Text' ) }
					</ClipboardButton>,
					<ClipboardButton key="copy-error" text={ error.stack } isSecondary>
						{ __( 'Copy Error' ) }
					</ClipboardButton>,
				] }
			>
				{ __( 'The editor has encountered an unexpected error.' ) }
			</Warning>
		);
	}
}

export default ErrorBoundary;
