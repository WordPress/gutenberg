/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, ClipboardButton } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { Warning } from '../';

class ErrorBoundary extends Component {
	constructor() {
		super( ...arguments );

		this.reboot = this.reboot.bind( this );
		this.getStateText = this.getStateText.bind( this );

		this.state = {
			hasEncounteredError: false,
		};
	}

	componentDidCatch() {
		this.setState( { hasEncounteredError: true } );
	}

	reboot() {
		this.props.onError( this.context.store.getState() );
	}

	getStateText() {
		return JSON.stringify( this.context.store.getState() );
	}

	render() {
		const { hasEncounteredError } = this.state;
		if ( ! hasEncounteredError ) {
			return this.props.children;
		}

		return (
			<Warning>
				<p>{ __(
					'The editor has encountered an unexpected error.'
				) }</p>
				<p>
					<Button onClick={ this.reboot } isLarge>
						{ __( 'Attempt Recovery' ) }
					</Button>
					<ClipboardButton text={ this.getStateText } isLarge>
						{ __( 'Copy State to Clipboard' ) }
					</ClipboardButton>
				</p>
			</Warning>
		);
	}
}

ErrorBoundary.contextTypes = {
	store: noop,
};

export default ErrorBoundary;
