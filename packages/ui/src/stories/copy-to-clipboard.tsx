import { speak } from '@wordpress/a11y';
import { useEffect, useRef, useState } from '@wordpress/element';
import { check, copy } from '@wordpress/icons';
import { Button } from '../button';
import { IconButton } from '../icon-button';
import { Stack } from '../stack';
import { Text } from '../text';

const SAMPLE_VALUE = 'Sample text';
const FEEDBACK_TIMEOUT = 2000;

function useCopyToClipboard() {
	const [ hasCopied, setHasCopied ] = useState( false );
	const timeoutRef = useRef< ReturnType< typeof setTimeout > | null >( null );
	const requestRef = useRef( 0 );

	useEffect( () => {
		return () => {
			if ( timeoutRef.current !== null ) {
				clearTimeout( timeoutRef.current );
			}
		};
	}, [] );

	function handleSuccess( requestId: number ) {
		if ( requestId !== requestRef.current ) {
			return;
		}
		setHasCopied( true );
		speak( 'Copied to clipboard' );
		timeoutRef.current = setTimeout( () => {
			timeoutRef.current = null;
			setHasCopied( false );
		}, FEEDBACK_TIMEOUT );
	}

	function handleFailure( requestId: number ) {
		if ( requestId !== requestRef.current ) {
			return;
		}
		setHasCopied( false );
		speak( "Couldn't copy to clipboard." );
	}

	function onCopy() {
		const requestId = ++requestRef.current;
		if ( timeoutRef.current !== null ) {
			clearTimeout( timeoutRef.current );
			timeoutRef.current = null;
		}

		let pending: Promise< void >;
		try {
			pending = navigator.clipboard.writeText( SAMPLE_VALUE );
		} catch {
			handleFailure( requestId );
			return;
		}

		void pending.then(
			() => {
				handleSuccess( requestId );
			},
			() => {
				handleFailure( requestId );
			}
		);
	}

	return { hasCopied, onCopy };
}

/**
 * Composes `Button` into a copy action with inline feedback.
 *
 * The visible label and accessible name stay "Copy". The icon shows the
 * result, and `speak()` announces it politely.
 */
export function CopyToClipboardExample() {
	const { hasCopied, onCopy } = useCopyToClipboard();

	return (
		<Stack direction="row" gap="sm" align="center">
			<Text>{ SAMPLE_VALUE }</Text>
			<Button onClick={ onCopy }>
				<Button.Icon icon={ hasCopied ? check : copy } />
				Copy
			</Button>
		</Stack>
	);
}

/**
 * Composes `IconButton` into the same copy action.
 *
 * `label` stays "Copy", so the accessible name and tooltip do not change.
 * The icon shows the result, and `speak()` announces it.
 */
export function CopyToClipboardIconButtonExample() {
	const { hasCopied, onCopy } = useCopyToClipboard();

	return (
		<Stack direction="row" gap="sm" align="center">
			<Text>{ SAMPLE_VALUE }</Text>
			<IconButton
				label="Copy"
				icon={ hasCopied ? check : copy }
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
