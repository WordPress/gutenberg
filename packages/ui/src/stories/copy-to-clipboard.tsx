import { speak } from '@wordpress/a11y';
import { useEffect, useRef, useState } from '@wordpress/element';
import { check, copy, error } from '@wordpress/icons';
import { Button } from '../button';
import { IconButton } from '../icon-button';
import { Stack } from '../stack';
import { Text } from '../text';

const SAMPLE_VALUE = 'Sample text';
const FEEDBACK_TIMEOUT = 2000;

type CopyResult = 'idle' | 'copied' | 'error';

const RESULT_ICON = {
	idle: copy,
	copied: check,
	error,
};

function useCopyToClipboard() {
	const [ result, setResult ] = useState< CopyResult >( 'idle' );
	const timeoutRef = useRef< ReturnType< typeof setTimeout > | null >( null );
	const requestRef = useRef( 0 );

	useEffect( () => {
		return () => {
			if ( timeoutRef.current !== null ) {
				clearTimeout( timeoutRef.current );
			}
		};
	}, [] );

	function showResult(
		requestId: number,
		next: Exclude< CopyResult, 'idle' >,
		message: string
	) {
		if ( requestId !== requestRef.current ) {
			return;
		}
		if ( timeoutRef.current !== null ) {
			clearTimeout( timeoutRef.current );
		}
		setResult( next );
		speak( message );
		timeoutRef.current = setTimeout( () => {
			timeoutRef.current = null;
			setResult( 'idle' );
		}, FEEDBACK_TIMEOUT );
	}

	function onCopy() {
		const requestId = ++requestRef.current;
		if ( timeoutRef.current !== null ) {
			clearTimeout( timeoutRef.current );
			timeoutRef.current = null;
		}
		setResult( 'idle' );

		let pending: Promise< void >;
		try {
			pending = navigator.clipboard.writeText( SAMPLE_VALUE );
		} catch {
			showResult( requestId, 'error', "Couldn't copy to clipboard." );
			return;
		}

		void pending.then(
			() => {
				showResult( requestId, 'copied', 'Copied to clipboard' );
			},
			() => {
				showResult( requestId, 'error', "Couldn't copy to clipboard." );
			}
		);
	}

	return { result, onCopy };
}

/**
 * Composes `Button` into a copy action with inline feedback.
 *
 * The visible label and accessible name stay "Copy". A check icon shows
 * success and an error icon shows failure. `speak()` announces the outcome.
 */
export function CopyToClipboardExample() {
	const { result, onCopy } = useCopyToClipboard();

	return (
		<Stack direction="row" gap="sm" align="center">
			<Text>{ SAMPLE_VALUE }</Text>
			<Button onClick={ onCopy }>
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
	const { result, onCopy } = useCopyToClipboard();

	return (
		<Stack direction="row" gap="sm" align="center">
			<Text>{ SAMPLE_VALUE }</Text>
			<IconButton
				label="Copy"
				icon={ RESULT_ICON[ result ] }
				onClick={ onCopy }
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
