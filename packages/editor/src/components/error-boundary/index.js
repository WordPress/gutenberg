/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { select } from '@wordpress/data';
import { Warning } from '@wordpress/block-editor';
import { useCopyToClipboard } from '@wordpress/compose';

function CopyButton( { text, children } ) {
	const ref = useCopyToClipboard( text );
	return (
		<Button variant="secondary" ref={ ref }>
			{ children }
		</Button>
	);
}

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
					<Button
						key="recovery"
						onClick={ this.reboot }
						variant="secondary"
					>
						{ __( 'Attempt Recovery' ) }
					</Button>,
					<CopyButton key="copy-post" text={ this.getContent }>
						{ __( 'Copy Post Text' ) }
					</CopyButton>,
					<CopyButton key="copy-error" text={ error.stack }>
						{ __( 'Copy Error' ) }
					</CopyButton>,
				] }
			>
				{ __( 'The editor has encountered an unexpected error.' ) }
			</Warning>
		);
	}
}

export default ErrorBoundary;
