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
		<Button size="compact" variant="secondary" ref={ ref }>
			{ children }
		</Button>
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
		this.setState( { error } );

		doAction( 'editor.ErrorBoundary.errorLogged', error );
	}

	render() {
		const { error } = this.state;
		if ( ! error ) {
			return this.props.children;
		}

		return (
			<Warning
				className="customize-widgets-error-boundary"
				actions={ [
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
