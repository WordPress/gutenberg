import { speak } from '@wordpress/a11y';
import { useCopyToClipboard } from '@wordpress/compose';
import { useEffect, useState } from '@wordpress/element';
import { check, copy, error } from '@wordpress/icons';
import { IconButton, InputControl, InputLayout } from '@wordpress/ui';

const SAMPLE_PATH = '/hello-world';
const FEEDBACK_TIMEOUT = 2000;

type CopyResult = 'idle' | 'copied' | 'error';

const RESULT_ICON = {
	idle: copy,
	copied: check,
	error,
};

function useCopyFeedback( text: string ) {
	const [ feedback, setFeedback ] = useState< { result: CopyResult } >( {
		result: 'idle',
	} );

	useEffect( () => {
		if ( feedback.result === 'idle' ) {
			return;
		}
		const timeoutId = setTimeout(
			() => setFeedback( { result: 'idle' } ),
			FEEDBACK_TIMEOUT
		);
		return () => clearTimeout( timeoutId );
	}, [ feedback ] );

	const ref = useCopyToClipboard(
		text,
		() => {
			// A new feedback object restarts the timeout for repeated copies.
			setFeedback( { result: 'copied' } );
			speak( 'Copied to clipboard' );
		},
		() => {
			setFeedback( { result: 'error' } );
			speak( "Couldn't copy to clipboard." );
		}
	);

	return { result: feedback.result, ref };
}

/**
 * Composes `InputControl` with a suffix `IconButton` that copies the field value.
 *
 * `label` stays "Copy", so the accessible name and tooltip do not change.
 * A check icon shows success and an error icon shows failure. `speak()`
 * announces the outcome.
 */
export function CopyFromFieldExample() {
	const [ value, setValue ] = useState( SAMPLE_PATH );
	const { result, ref } = useCopyFeedback( value );

	return (
		<InputControl
			label="Text"
			value={ value }
			onValueChange={ setValue }
			suffix={
				<InputLayout.Slot padding="minimal">
					<IconButton
						ref={ ref }
						label="Copy"
						icon={ RESULT_ICON[ result ] }
						variant="minimal"
						tone="neutral"
						size="small"
					/>
				</InputLayout.Slot>
			}
		/>
	);
}
