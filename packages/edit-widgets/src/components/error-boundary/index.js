/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { Warning } from '@wordpress/block-editor';
import { useCopyToClipboard } from '@wordpress/compose';
import { doAction } from '@wordpress/hooks';

function CopyButton( { text, children } ) {
	const ref = useCopyToClipboard( text );
	return (
		<Button __next40pxDefaultSize variant="secondary" ref={ ref }>
			{ children }
		</Button>
	);
}

function ErrorBoundaryWarning( { message, error } ) {
	const actions = [
		<CopyButton key="copy-error" text={ error.stack }>
			{ __( 'Copy Error' ) }
		</CopyButton>,
	];

	return (
		<Warning className="edit-widgets-error-boundary" actions={ actions }>
			{ message }
		</Warning>
	);
}

export default class ErrorBoundary extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			error: null,
		};
	}

	componentDidCatch( error ) {
		doAction( 'editor.ErrorBoundary.errorLogged', error );
	}

	static getDerivedStateFromError( error ) {
		return { error };
	}

	render() {
		if ( ! this.state.error ) {
			return this.props.children;
		}

		return (
			<ErrorBoundaryWarning
				message={ __(
					'The editor has encountered an unexpected error.'
				) }
				error={ this.state.error }
			/>
		);
	}
}
