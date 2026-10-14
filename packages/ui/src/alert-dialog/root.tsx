import { AlertDialog as _AlertDialog } from '@base-ui/react/alert-dialog';
import { speak } from '@wordpress/a11y';
import { useEvent } from '@wordpress/compose';
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
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

interface LifecycleState {
	phase: Phase;
	showSpinner: boolean;
	errorMessage?: string;
}

function createLifecycleState() {
	let value: LifecycleState = {
		phase: 'idle',
		showSpinner: false,
		errorMessage: undefined,
	};
	const listeners = new Set< () => void >();

	return {
		getValue: () => value,
		subscribe: ( listener: () => void ) => {
			listeners.add( listener );
			return () => {
				listeners.delete( listener );
			};
		},
		update: ( updates: Partial< LifecycleState > ) => {
			value = { ...value, ...updates };
			listeners.forEach( ( listener ) => listener() );
		},
	};
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
	const [ lifecycle ] = useState( createLifecycleState );
	const lifecycleState = useSyncExternalStore(
		lifecycle.subscribe,
		lifecycle.getValue,
		lifecycle.getValue
	);

	const actionsRef = useRef< _AlertDialog.Root.Actions | null >( null );

	const onConfirmEvent = useEvent( onConfirm );

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
		if ( effectiveOpen && lifecycleState.phase === 'closing' ) {
			lifecycle.update( { phase: 'idle', showSpinner: false } );
		}
	}, [ effectiveOpen, lifecycle, lifecycleState.phase ] );

	const handleOpenChange = useCallback(
		(
			nextOpen: boolean,
			eventDetails: _AlertDialog.Root.ChangeEventDetails
		) => {
			// Block dismiss while a confirm action is pending.
			if ( ! nextOpen && lifecycle.getValue().phase === 'pending' ) {
				return;
			}

			if ( ! nextOpen && lifecycle.getValue().phase === 'idle' ) {
				lifecycle.update( { phase: 'closing' } );
			}

			setInternalOpen( nextOpen );
			onOpenChange?.( nextOpen, eventDetails );
		},
		[ lifecycle, onOpenChange ]
	);

	const confirm = useCallback( async () => {
		if ( lifecycle.getValue().phase !== 'idle' ) {
			return;
		}

		lifecycle.update( { phase: 'pending', errorMessage: undefined } );

		const id = ++confirmIdRef.current;

		try {
			const rawResult = onConfirmEvent?.();

			// Show spinner only for async handlers (Promises).
			// Sync handlers resolve in the same tick — no spinner needed.
			if ( isThenable( rawResult ) ) {
				lifecycle.update( { showSpinner: true } );
			}

			const result = await Promise.resolve( rawResult );

			// Discard if the component unmounted or the dialog was
			// dismissed and reopened while the promise was in flight.
			if ( confirmIdRef.current !== id ) {
				return;
			}

			// An error message implies the dialog should stay open.
			if ( result?.error ) {
				lifecycle.update( {
					phase: 'idle',
					showSpinner: false,
					errorMessage: result.error,
				} );
				speak( result.error, 'assertive' );
				return;
			}

			const shouldClose = result?.close !== false;

			if ( shouldClose ) {
				lifecycle.update( { phase: 'closing' } );
				actionsRef.current?.close();
			} else {
				lifecycle.update( { phase: 'idle', showSpinner: false } );
			}
		} catch ( error ) {
			if ( confirmIdRef.current !== id ) {
				return;
			}
			lifecycle.update( { phase: 'idle', showSpinner: false } );
			// eslint-disable-next-line no-console
			console.error( error );
		}
	}, [ lifecycle, onConfirmEvent ] );

	const handleOpenChangeComplete = useCallback(
		( open: boolean ) => {
			if ( ! open ) {
				// Invalidate any in-flight async so a stale promise settling
				// after dismiss+reopen doesn't close the new session.
				confirmIdRef.current++;
				lifecycle.update( {
					phase: 'idle',
					showSpinner: false,
					errorMessage: undefined,
				} );
			}
		},
		[ lifecycle ]
	);

	const contextValue = useMemo(
		() => ( {
			...lifecycleState,
			confirm,
		} ),
		[ lifecycleState, confirm ]
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
