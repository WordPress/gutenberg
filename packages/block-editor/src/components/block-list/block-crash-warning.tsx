import { speak } from '@wordpress/a11y';
import { useCopyToClipboard } from '@wordpress/compose';
import { useEffect, useState } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
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
	// Bump the id on every result so a repeat of the same outcome restarts
	// the time the icon stays visible.
	const [ feedback, setFeedback ] = useState< {
		result: CopyResult;
		id: number;
	} >( { result: 'idle', id: 0 } );

	useEffect( () => {
		if ( feedback.result === 'idle' ) {
			return;
		}
		const timeoutId = setTimeout(
			() => setFeedback( { result: 'idle', id: 0 } ),
			COPY_FEEDBACK_TIMEOUT
		);
		return () => clearTimeout( timeoutId );
	}, [ feedback ] );

	function report( result: Exclude< CopyResult, 'idle' >, message: string ) {
		setFeedback( ( current ) => ( {
			result,
			id: current.id + 1,
		} ) );
		speak( message );
	}

	const ref = useCopyToClipboard(
		() => error.stack ?? String( error ),
		() => report( 'copied', __( 'Copied to clipboard' ) ),
		() => report( 'error', __( "Couldn't copy to clipboard." ) )
	);

	return (
		<Button
			ref={ ref }
			variant="secondary"
			size="compact"
			icon={ RESULT_ICON[ feedback.result ] }
		>
			{ _x( 'Copy error', 'button label' ) }
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
