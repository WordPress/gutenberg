/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { Warning } from '@wordpress/block-editor';
import { useCopyToClipboard } from '@wordpress/compose';

function CopyButton( { text, children } ) {
	const ref = useCopyToClipboard( text );
	return (
		<Button variant="secondary" ref={ ref }>
			{ children }
		</Button>
	);
}

export default function ErrorBoundaryWarning( {
	message,
	error,
	reboot,
	dashboardLink,
} ) {
	const actions = [];

	if ( reboot ) {
		actions.push(
			<Button key="recovery" onClick={ reboot } variant="secondary">
				{ __( 'Attempt Recovery' ) }
			</Button>
		);
	}

	if ( error ) {
		actions.push(
			<CopyButton key="copy-error" text={ error.stack }>
				{ __( 'Copy Error' ) }
			</CopyButton>
		);
	}

	if ( dashboardLink ) {
		actions.push(
			<Button
				key="back-to-dashboard"
				variant="secondary"
				href={ dashboardLink }
			>
				{ __( 'Back to dashboard' ) }
			</Button>
		);
	}

	return (
		<Warning className="editor-error-boundary" actions={ actions }>
			{ message }
		</Warning>
	);
}
