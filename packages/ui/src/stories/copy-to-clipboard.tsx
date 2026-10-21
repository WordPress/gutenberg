import { useEffect, useRef, useState } from '@wordpress/element';
import { check, copy } from '@wordpress/icons';
import { Button } from '../button';
import { IconButton } from '../icon-button';
import { Stack } from '../stack';
import { Text } from '../text';
import { VisuallyHidden } from '../visually-hidden';

const SAMPLE_VALUE = 'Sample text';
const FEEDBACK_TIMEOUT = 2000;

function useCopyToClipboard() {
	const [ hasCopied, setHasCopied ] = useState( false );
	const [ announcement, setAnnouncement ] = useState( '' );
	const timeoutRef = useRef< ReturnType< typeof setTimeout > | null >( null );
	const frameRef = useRef< number | null >( null );
	const requestRef = useRef( 0 );

	useEffect( () => {
		return () => {
			if ( timeoutRef.current !== null ) {
				clearTimeout( timeoutRef.current );
			}
			if ( frameRef.current !== null ) {
				cancelAnimationFrame( frameRef.current );
			}
		};
	}, [] );

	// A live region announces a change. Empty it before writing the same
	// message again, and wait a frame so the empty text is committed first.
	function announce( message: string ) {
		if ( frameRef.current !== null ) {
			cancelAnimationFrame( frameRef.current );
		}
		setAnnouncement( '' );
		frameRef.current = requestAnimationFrame( () => {
			frameRef.current = null;
			setAnnouncement( message );
		} );
	}

	function handleSuccess( requestId: number ) {
		if ( requestId !== requestRef.current ) {
			return;
		}
		setHasCopied( true );
		announce( 'Copied to clipboard' );
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
		announce( "Couldn't copy to clipboard." );
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

	return { hasCopied, announcement, onCopy };
}

/**
 * Composes `Button` into a copy action with inline feedback.
 *
 * The accessible name stays "Copy". The visible label can change because it
 * is hidden from assistive technology. Outcome text is written to a status
 * region that is mounted before the first copy.
 */
export function CopyToClipboardExample() {
	const { hasCopied, announcement, onCopy } = useCopyToClipboard();

	return (
		<div>
			<Stack direction="row" gap="sm" align="center">
				<Text>{ SAMPLE_VALUE }</Text>
				<Button aria-label="Copy" onClick={ onCopy }>
					<Button.Icon icon={ hasCopied ? check : copy } />
					<span aria-hidden="true">
						{ hasCopied ? 'Copied' : 'Copy' }
					</span>
				</Button>
			</Stack>
			{ /* Mounted before the copy so assistive technology observes the text change. */ }
			<VisuallyHidden role="status">{ announcement }</VisuallyHidden>
		</div>
	);
}

/**
 * Composes `IconButton` into the same copy action.
 *
 * `label` stays "Copy", so the accessible name and tooltip do not change.
 * The icon swaps, and the status region announces the result.
 */
export function CopyToClipboardIconButtonExample() {
	const { hasCopied, announcement, onCopy } = useCopyToClipboard();

	return (
		<div>
			<Stack direction="row" gap="sm" align="center">
				<Text>{ SAMPLE_VALUE }</Text>
				<IconButton
					label="Copy"
					icon={ hasCopied ? check : copy }
					onClick={ onCopy }
				/>
			</Stack>
			<VisuallyHidden role="status">{ announcement }</VisuallyHidden>
		</div>
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
