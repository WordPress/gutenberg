/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
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

export default class ErrorBoundary extends Component {
	constructor() {
		super( ...arguments );

		this.reboot = this.reboot.bind( this );

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

	render() {
		const { error } = this.state;
		if ( ! error ) {
			return this.props.children;
		}

		return (
			<Warning
				className="edit-widgets-error-boundary"
				actions={ [
					<Button
						key="recovery"
						onClick={ this.reboot }
						variant="secondary"
					>
						{ __( 'Attempt Recovery' ) }
					</Button>,
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
