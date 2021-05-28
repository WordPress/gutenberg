/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { Warning } from '@wordpress/block-editor';

class ErrorBoundary extends Component {
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
		if ( this.props.onError ) {
			this.props.onError();
		}
	}

	render() {
		const { error } = this.state;
		if ( ! error ) {
			return this.props.children;
		}

		return (
			<Warning
				className="navigation-editor-error-boundary"
				actions={ [
					<Button
						key="recovery"
						onClick={ this.reboot }
						variant="secondary"
					>
						{ __( 'Attempt Recovery' ) }
					</Button>,
				] }
			>
				{ __(
					'The navigation editor has encountered an unexpected error.'
				) }
			</Warning>
		);
	}
}

export default ErrorBoundary;
