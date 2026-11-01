import { speak } from '@wordpress/a11y';
import { useCopyToClipboard } from '@wordpress/compose';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { check, copy, error as errorIcon } from '@wordpress/icons';
import { Button } from '@wordpress/components';
import Warning from '../warning';

const COPY_FEEDBACK_TIMEOUT = 2000;

type CopyResult = 'idle' | 'copied' | 'error';

const RESULT_ICON = {
	idle: copy,
	copied: check,
	error: errorIcon,
};

function CopyErrorButton( { error }: { error: Error } ) {
	const [ result, setResult ] = useState< CopyResult >( 'idle' );

	useEffect( () => {
		if ( result === 'idle' ) {
			return;
		}
		const timeoutId = setTimeout(
			() => setResult( 'idle' ),
			COPY_FEEDBACK_TIMEOUT
		);
		return () => clearTimeout( timeoutId );
	}, [ result ] );

	const ref = useCopyToClipboard(
		() => error.stack ?? String( error ),
		() => {
			setResult( 'copied' );
			speak( __( 'Copied to clipboard' ) );
		},
		() => {
			setResult( 'error' );
			speak( __( "Couldn't copy to clipboard." ) );
		}
	);

	return (
		<Button
			ref={ ref }
			variant="secondary"
			size="compact"
			icon={ RESULT_ICON[ result ] }
		>
			{ __( 'Copy error' ) }
		</Button>
	);
}

export default function BlockCrashWarning( { error }: { error: Error } ) {
	return (
		<Warning
			className="block-editor-block-list__block-crash-warning"
			actions={ [ <CopyErrorButton key="copy-error" error={ error } /> ] }
		>
			{ __(
				'This block has encountered an error and cannot be previewed.'
			) }
		</Warning>
	);
}
