import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
// eslint-disable-next-line @wordpress/use-recommended-components -- The fallback UI renders outside the editor's notice system.
import { Collapsible, Notice, Stack, Text } from '@wordpress/ui';
import { select } from '@wordpress/data';
import { useCopyToClipboard } from '@wordpress/compose';
import { doAction } from '@wordpress/hooks';
import { chevronDown } from '@wordpress/icons';
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

// A boundary catches whatever was thrown, which is not always an `Error`.
function getErrorMessage( error ) {
	if ( error instanceof Error ) {
		const message = [ error.name, error.message ]
			.filter( Boolean )
			.join( ': ' );
		if ( message ) {
			return message;
		}
	} else if ( typeof error === 'string' && error ) {
		return error;
	} else if ( typeof error?.message === 'string' && error.message ) {
		return error.message;
	}

	return __( 'An unknown error occurred.' );
}

// Markdown, so the report stays readable as plain text and renders when pasted
// into a bug report. Deliberately untranslated: the audience is a developer.
function getErrorReport( error, componentStack ) {
	const sections = [ `### Editor error\n\n${ getErrorMessage( error ) }` ];

	if ( error?.stack ) {
		sections.push(
			`#### Stack trace\n\n\`\`\`\n${ error.stack.trim() }\n\`\`\``
		);
	}

	if ( componentStack ) {
		sections.push(
			`#### Component stack\n\n\`\`\`\n${ componentStack.trim() }\n\`\`\``
		);
	}

	sections.push(
		`#### Environment\n\n- User agent: ${ window.navigator.userAgent }`
	);

	return sections.join( '\n\n' );
}

function CopyButton( { text, children, variant = 'outline' } ) {
	const ref = useCopyToClipboard( text );
	return (
		<Notice.ActionButton variant={ variant } ref={ ref }>
			{ children }
		</Notice.ActionButton>
	);
}

function ErrorDetail( { label, children } ) {
	return (
		<Stack direction="column" gap="xs">
			<Text variant="heading-sm">{ label }</Text>
			<pre className="editor-error-boundary__detail">{ children }</pre>
		</Stack>
	);
}

function ErrorDetails( { error, componentStack } ) {
	return (
		<Collapsible.Root className="editor-error-boundary__details">
			<Collapsible.Trigger
				render={
					<Button
						variant="tertiary"
						size="compact"
						icon={ chevronDown }
						iconPosition="right"
					/>
				}
			>
				{ __( 'Show error details' ) }
			</Collapsible.Trigger>
			<Collapsible.Panel>
				<Stack direction="column" gap="md">
					<ErrorDetail label={ __( 'Error' ) }>
						{ getErrorMessage( error ) }
					</ErrorDetail>
					{ componentStack && (
						<ErrorDetail label={ __( 'Component stack' ) }>
							{ componentStack.trim() }
						</ErrorDetail>
					) }
				</Stack>
			</Collapsible.Panel>
		</Collapsible.Root>
	);
}

class ErrorBoundary extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			error: null,
			componentStack: null,
		};
	}

	componentDidCatch( error, errorInfo ) {
		this.setState( { componentStack: errorInfo?.componentStack } );
		doAction( 'editor.ErrorBoundary.errorLogged', error, errorInfo );
	}

	static getDerivedStateFromError( error ) {
		return { error };
	}

	render() {
		const { error, componentStack } = this.state;
		const { canCopyContent = false } = this.props;
		if ( ! error ) {
			return this.props.children;
		}

		return (
			<Stack
				className="editor-error-boundary"
				direction="column"
				gap="lg"
			>
				<Notice.Root intent="error">
					<Notice.Title>
						{ __( 'The editor has crashed' ) }
					</Notice.Title>
					<Notice.Description>
						{ __(
							'An unknown error occurred. Reload your browser to try again, or copy the error to report the problem or search.'
						) }
					</Notice.Description>
					<Notice.Actions>
						{ canCopyContent && (
							<CopyButton text={ getContent }>
								{ __( 'Copy contents' ) }
							</CopyButton>
						) }
						<CopyButton
							variant="solid"
							text={ () =>
								getErrorReport( error, componentStack )
							}
						>
							{ __( 'Copy error' ) }
						</CopyButton>
					</Notice.Actions>
				</Notice.Root>
				{ globalThis.SCRIPT_DEBUG ? (
					<ErrorDetails
						error={ error }
						componentStack={ componentStack }
					/>
				) : null }
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
