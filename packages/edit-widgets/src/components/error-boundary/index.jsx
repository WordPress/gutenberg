import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
// eslint-disable-next-line @wordpress/use-recommended-components -- The fallback UI renders outside the editor's notice system.
import { Card, CollapsibleCard, Notice, Stack, Text } from '@wordpress/ui';
import { useCopyToClipboard } from '@wordpress/compose';
import { doAction } from '@wordpress/hooks';

// A boundary catches whatever was thrown, which is not always an `Error`.
function getErrorName( error ) {
	return ( error instanceof Error && error.name ) || 'Error';
}

function getErrorMessage( error ) {
	if ( typeof error === 'string' && error ) {
		return error;
	}

	if ( typeof error?.message === 'string' && error.message ) {
		return error.message;
	}

	return 'An unknown error occurred.';
}

// The sections of the report, shared by the copied Markdown and the details
// panel so that the two cannot drift apart. Deliberately untranslated: both
// are developer-facing, and the report is pasted into a bug report.
function getErrorSections( error, componentStack ) {
	const sections = [
		{ label: getErrorName( error ), content: getErrorMessage( error ) },
	];

	if ( error?.stack ) {
		sections.push( {
			label: 'Stack',
			content: error.stack.trim(),
			preformatted: true,
		} );
	}

	if ( componentStack ) {
		sections.push( {
			label: 'Component stack',
			content: componentStack.trim(),
			preformatted: true,
		} );
	}

	sections.push( {
		label: 'Environment',
		content: `User agent: ${ window.navigator.userAgent }`,
		preformatted: true,
	} );

	return sections;
}

// Markdown, so the report stays readable as plain text and renders when pasted
// into a bug report.
function getErrorReport( error, componentStack ) {
	const sections = getErrorSections( error, componentStack ).map(
		( { label, content, preformatted } ) =>
			`**${ label }**\n\n${
				preformatted ? `\`\`\`\n${ content }\n\`\`\`` : content
			}`
	);

	return [ '### Error report', ...sections ].join( '\n\n' );
}

function CopyButton( { text, children, variant = 'outline' } ) {
	const ref = useCopyToClipboard( text );
	return (
		<Notice.ActionButton variant={ variant } ref={ ref }>
			{ children }
		</Notice.ActionButton>
	);
}

function ErrorReport( { error, componentStack } ) {
	return (
		<Stack
			className="edit-widgets-error-boundary__report"
			direction="column"
			gap="md"
		>
			{ getErrorSections( error, componentStack ).map(
				( { label, content } ) => (
					<Stack key={ label } direction="column" gap="xs">
						<Text variant="heading-md">{ label }</Text>
						<pre className="edit-widgets-error-boundary__report-section">
							{ content }
						</pre>
					</Stack>
				)
			) }
		</Stack>
	);
}

function ErrorDetails( { error, componentStack } ) {
	return (
		<CollapsibleCard.Root className="edit-widgets-error-boundary__details">
			<CollapsibleCard.Header>
				<Card.Title>{ __( 'Error details' ) }</Card.Title>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>
				<ErrorReport
					error={ error }
					componentStack={ componentStack }
				/>
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
}

export default class ErrorBoundary extends Component {
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
		if ( ! error ) {
			return this.props.children;
		}

		return (
			<Stack
				className="edit-widgets-error-boundary"
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
