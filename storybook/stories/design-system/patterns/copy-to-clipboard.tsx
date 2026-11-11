import { speak } from '@wordpress/a11y';
import { useCopyToClipboard } from '@wordpress/compose';
import { useEffect, useState } from '@wordpress/element';
import { check, copy, error } from '@wordpress/icons';
import { Button, IconButton, Stack, Text } from '@wordpress/ui';

const SAMPLE_VALUE = 'Sample text';
const FEEDBACK_TIMEOUT = 2000;

type CopyResult = 'idle' | 'copied' | 'error';

const RESULT_ICON = {
	idle: copy,
	copied: check,
	error,
};

function useCopyFeedback() {
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
			FEEDBACK_TIMEOUT
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
		SAMPLE_VALUE,
		() => report( 'copied', 'Copied to clipboard' ),
		() => report( 'error', "Couldn't copy to clipboard." )
	);

	return { result: feedback.result, ref };
}

/**
 * Composes `Button` into a copy action with inline feedback.
 *
 * The visible label and accessible name stay "Copy". A check icon shows
 * success and an error icon shows failure. `speak()` announces the outcome.
 */
export function CopyToClipboardExample() {
	const { result, ref } = useCopyFeedback();

	return (
		<Stack direction="row" gap="sm" align="center">
			<Text>{ SAMPLE_VALUE }</Text>
			<Button ref={ ref } variant="minimal" tone="neutral" size="compact">
				<Button.Icon icon={ RESULT_ICON[ result ] } />
				Copy
			</Button>
		</Stack>
	);
}

/**
 * Composes `IconButton` into the same copy action.
 *
 * `label` stays "Copy", so the accessible name and tooltip do not change.
 * A check icon shows success and an error icon shows failure. `speak()`
 * announces the outcome.
 */
export function CopyToClipboardIconButtonExample() {
	const { result, ref } = useCopyFeedback();

	return (
		<Stack direction="row" gap="sm" align="center">
			<Text>{ SAMPLE_VALUE }</Text>
			<IconButton
				ref={ ref }
				label="Copy"
				icon={ RESULT_ICON[ result ] }
				variant="minimal"
				tone="neutral"
				size="compact"
			/>
		</Stack>
	);
}

/**
 * Labeled and icon-only copy actions, shown together in the pattern.
 */
export function CopyToClipboardExamples() {
	return (
		<Stack direction="column" gap="lg">
			<CopyToClipboardExample />
			<CopyToClipboardIconButtonExample />
		</Stack>
	);
}
