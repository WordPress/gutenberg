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
		<Button
			// TODO: Switch to `true` (40px size) if possible
			__next40pxDefaultSize={ false }
			variant="secondary"
			ref={ ref }
		>
			{ children }
		</Button>
	);
}

export default function ErrorBoundaryWarning( { message, error } ) {
	const actions = [
		<CopyButton key="copy-error" text={ error.stack }>
			{ __( 'Copy Error' ) }
		</CopyButton>,
	];

	return (
		<Warning className="editor-error-boundary" actions={ actions }>
			{ message }
		</Warning>
	);
}
