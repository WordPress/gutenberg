import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { Stack, Text } from '@wordpress/ui';
import { select } from '@wordpress/data';
import { useCopyToClipboard } from '@wordpress/compose';
import { doAction } from '@wordpress/hooks';
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
	} catch {}
}

function CopyButton( { text, children, variant = 'secondary' } ) {
	const ref = useCopyToClipboard( text );
	return (
		<Button __next40pxDefaultSize variant={ variant } ref={ ref }>
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
		doAction( 'editor.ErrorBoundary.errorLogged', error );
	}

	static getDerivedStateFromError( error ) {
		return { error };
	}

	render() {
		const { error } = this.state;
		const { canCopyContent = false } = this.props;
		if ( ! error ) {
			return this.props.children;
		}

		return (
			<Stack
				className="editor-error-boundary"
				align="baseline"
				gap="lg"
				justify="space-between"
				wrap="wrap"
			>
				<Text render={ <p /> }>
					{ __( 'The editor has encountered an unexpected error.' ) }
				</Text>
				<Stack align="center" gap="sm">
					{ canCopyContent && (
						<CopyButton text={ getContent }>
							{ __( 'Copy contents' ) }
						</CopyButton>
					) }
					<CopyButton variant="primary" text={ error?.stack }>
						{ __( 'Copy error' ) }
					</CopyButton>
				</Stack>
			</Stack>
		);
	}
}

/**
 * ErrorBoundary is used to catch JavaScript errors anywhere in a child component tree, log those errors, and display a fallback UI.
 *
 * It uses the lifecycle methods getDerivedStateFromError and componentDidCatch to catch errors in a child component tree.
 *
 * getDerivedStateFromError is used to render a fallback UI after an error has been thrown, and componentDidCatch is used to log error information.
 *
 * @class ErrorBoundary
 * @augments Component
 */
export default ErrorBoundary;
