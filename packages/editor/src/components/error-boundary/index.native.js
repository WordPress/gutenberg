/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { select } from '@wordpress/data';
import { Warning } from '@wordpress/block-editor';
import { useCopyToClipboard } from '@wordpress/compose';
import { logException } from '@wordpress/react-native-bridge';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

function getContent() {
	try {
		// While `select` in a component is generally discouraged, it is
		// used here because it (a) reduces the chance of data loss in the
		// case of additional errors by performing a direct retrieval and
		// (b) avoids the performance cost associated with unnecessary
		// content serialization throughout the lifetime of a non-erroring
		// application.
		return select( editorStore ).getEditedPostContent();
	} catch ( error ) {}
}

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

		this.state = {
			error: null,
		};
	}

	componentDidCatch( error ) {
		logException( error, {
			context: {
				component_stack: error.componentStack,
			},
			isHandled: true,
			handledBy: 'Editor-level Error Boundary',
		} );
	}

	static getDerivedStateFromError( error ) {
		return { error };
	}

	render() {
		const { error } = this.state;
		if ( ! error ) {
			return this.props.children;
		}

		const actions = [
			<CopyButton key="copy-post" text={ getContent }>
				{ __( 'Copy Post Text' ) }
			</CopyButton>,
			<CopyButton key="copy-error" text={ error.stack }>
				{ __( 'Copy Error' ) }
			</CopyButton>,
		];

		return (
			<Warning
				actions={ actions }
				message={ __(
					'The editor has encountered an unexpected error.'
				) }
			/>
		);
	}
}

export default ErrorBoundary;
