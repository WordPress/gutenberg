/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { Warning } from '@wordpress/block-editor';
import { doAction } from '@wordpress/hooks';

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

		if ( typeof this.props.errorActionName === 'string' ) {
			doAction( this.props.errorActionName );
		}
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
					<Button key="recovery" onClick={ this.reboot } isSecondary>
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
