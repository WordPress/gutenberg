import { AlertDialog as _AlertDialog } from '@base-ui/react/alert-dialog';
import { speak } from '@wordpress/a11y';
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';

import { AlertDialogContext } from './context';
import type { Phase } from './context';
import type { RootProps } from './types';

function isThenable( value: unknown ): value is PromiseLike< unknown > {
	return (
		value !== null &&
		value !== undefined &&
		typeof ( value as PromiseLike< unknown > ).then === 'function'
	);
}

/**
 * A dialog that requires a user response to proceed.
 *
 * Use `AlertDialog.Trigger` to render a button that opens the dialog.
 * Use `AlertDialog.Popup` to render the dialog content.
 * The `AlertDialog.Trigger` is optional — the dialog can also be controlled
 * via `open` / `onOpenChange` props.
 *
 * For use cases outside the standard confirm/cancel pattern, use the lower-level
 * `Dialog` component directly.
 *
 * See the [Destructive Actions guidelines](https://wordpress.github.io/gutenberg/?path=/docs/design-system-patterns-destructive-actions--docs)
 * for more details on when to use each pattern.
 */
function Root( {
	children,
	open: openProp,
	onOpenChange,
	defaultOpen,
	onConfirm,
}: RootProps ) {
	const [ internalOpen, setInternalOpen ] = useState( defaultOpen ?? false );

	// Internal state machine for the confirm-and-close lifecycle.
	//
	// Phase transitions:
	//
	//   idle ──> pending ──> closing ──> idle
	//           (confirm     (success,   (animation
	//            clicked)     close)      complete)
	//
	//   idle ──> pending ──> idle
	//           (confirm     (error, or
	//            clicked)     {close:false})
	//
	//   idle ──> closing ──> idle
	//           (cancel/     (animation
	//            escape)      complete)
	//
	// `showSpinner` tracks whether the confirm button shows a loading
	// indicator. It is orthogonal to `phase`:
	//
	//   Scenario                  | pending | closing
	//   --------------------------+---------+---------
	//   Sync onConfirm            | false   | false
	//   Async onConfirm (success) | true    | true
	//   Async onConfirm (error)   | true    | n/a (-> idle)
	//   Cancel / Escape           | n/a     | false
	//
	// Buttons are disabled whenever phase !== 'idle'.
	// Dismiss (Escape / Cancel) is blocked during 'pending'.
	const [ phase, setPhase ] = useState< Phase >( 'idle' );
	const [ showSpinner, setShowSpinner ] = useState( false );
	const [ errorMessage, setErrorMessage ] = useState< string >();

	const actionsRef = useRef< _AlertDialog.Root.Actions | null >( null );

	const onConfirmRef = useRef( onConfirm );
	onConfirmRef.current = onConfirm;

	// Ref keeps phase accessible synchronously from callbacks that may
	// run between a setState call and the subsequent React re-render.
	const phaseRef = useRef( phase );
	phaseRef.current = phase;

	// Generation counter — safety net for the edge case where the component
	// unmounts while an async confirm is in flight. Also incremented when
	// the dialog finishes closing, so a stale promise settling after a
	// dismiss+reopen cycle is silently discarded.
	const confirmIdRef = useRef( 0 );

	const effectiveOpen = openProp ?? internalOpen;

	// Safety net: if the consumer keeps `open={true}` after a confirm
	// (i.e. does not react to `onOpenChange`), the phase would be stuck
	// at 'closing'. Detect the contradiction and reset to idle.
	useEffect( () => {
		if ( effectiveOpen && phase === 'closing' ) {
			phaseRef.current = 'idle';
			setPhase( 'idle' );
			setShowSpinner( false );
		}
	}, [ effectiveOpen, phase ] );

	const handleOpenChange = useCallback(
		(
			nextOpen: boolean,
			eventDetails: _AlertDialog.Root.ChangeEventDetails
		) => {
			// Block dismiss while a confirm action is pending.
			if ( ! nextOpen && phaseRef.current === 'pending' ) {
				return;
			}

			if ( ! nextOpen && phaseRef.current === 'idle' ) {
				phaseRef.current = 'closing';
				setPhase( 'closing' );
			}

			setInternalOpen( nextOpen );
			onOpenChange?.( nextOpen, eventDetails );
		},
		[ onOpenChange ]
	);

	const confirm = useCallback( async () => {
		if ( phaseRef.current !== 'idle' ) {
			return;
		}

		phaseRef.current = 'pending';
		setPhase( 'pending' );
		setErrorMessage( undefined );

		const id = ++confirmIdRef.current;

		try {
			const rawResult = onConfirmRef.current?.();

			// Show spinner only for async handlers (Promises).
			// Sync handlers resolve in the same tick — no spinner needed.
			if ( isThenable( rawResult ) ) {
				setShowSpinner( true );
			}

			const result = await Promise.resolve( rawResult );

			// Discard if the component unmounted or the dialog was
			// dismissed and reopened while the promise was in flight.
			if ( confirmIdRef.current !== id ) {
				return;
			}

			// An error message implies the dialog should stay open.
			if ( result?.error ) {
				phaseRef.current = 'idle';
				setPhase( 'idle' );
				setShowSpinner( false );
				setErrorMessage( result.error );
				speak( result.error, 'assertive' );
				return;
			}

			const shouldClose = result?.close !== false;

			if ( shouldClose ) {
				phaseRef.current = 'closing';
				setPhase( 'closing' );
				actionsRef.current?.close();
			} else {
				phaseRef.current = 'idle';
				setPhase( 'idle' );
				setShowSpinner( false );
			}
		} catch ( error ) {
			if ( confirmIdRef.current !== id ) {
				return;
			}
			phaseRef.current = 'idle';
			setPhase( 'idle' );
			setShowSpinner( false );
			// eslint-disable-next-line no-console
			console.error( error );
		}
	}, [] );

	const handleOpenChangeComplete = useCallback( ( open: boolean ) => {
		if ( ! open ) {
			// Invalidate any in-flight async so a stale promise settling
			// after dismiss+reopen doesn't close the new session.
			confirmIdRef.current++;
			phaseRef.current = 'idle';
			setPhase( 'idle' );
			setShowSpinner( false );
			setErrorMessage( undefined );
		}
	}, [] );

	const contextValue = useMemo(
		() => ( {
			phase,
			showSpinner,
			errorMessage,
			confirm,
		} ),
		[ phase, showSpinner, errorMessage, confirm ]
	);

	return (
		<_AlertDialog.Root
			open={ effectiveOpen }
			defaultOpen={ defaultOpen }
			onOpenChange={ handleOpenChange }
			onOpenChangeComplete={ handleOpenChangeComplete }
			actionsRef={ actionsRef }
		>
			<AlertDialogContext.Provider value={ contextValue }>
				{ children }
			</AlertDialogContext.Provider>
		</_AlertDialog.Root>
	);
}

export { Root };
