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
import { getEditedPostContent } from '../../selectors';

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
			return getEditedPostContent( this.context.store.getState() );
		} catch ( error ) {}
	}

	render() {
		const { error } = this.state;
		if ( ! error ) {
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
					<ClipboardButton text={ this.getContent } isLarge>
						{ __( 'Copy Post Text' ) }
					</ClipboardButton>
					<ClipboardButton text={ error.stack } isLarge>
						{ __( 'Copy Error' ) }
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
