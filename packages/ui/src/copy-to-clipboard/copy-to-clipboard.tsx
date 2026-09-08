import type { ReactElement, Ref } from 'react';
import { useCopyToClipboard, useEvent, useMergeRefs } from '@wordpress/compose';
import {
	cloneElement,
	isValidElement,
	useEffect,
	useRef,
	useState,
} from '@wordpress/element';
import type { CopyToClipboardProps, CopyToClipboardStatus } from './types';

const INITIAL_STATUS: CopyToClipboardStatus = 'pending';

export const DEFAULT_TIMEOUT = 1000;

function getElementRef( element: ReactElement ): Ref< HTMLElement > | null {
	const fromElement = ( element as { ref?: Ref< HTMLElement > | null } ).ref;
	if ( fromElement ) {
		return fromElement;
	}

	const fromProps = ( element.props as { ref?: Ref< HTMLElement > | null } )
		.ref;
	return fromProps ?? null;
}

/**
 * Copies text to the clipboard when a child is clicked, and exposes the copy
 * status to that child. Use `ClipboardButton` for a ready-made control.
 *
 * ```jsx
 * import { CopyToClipboard } from '@wordpress/ui';
 *
 * function MyCopyTrigger() {
 * 	return (
 * 		<CopyToClipboard text="Text to copy">
 * 			{ ( status ) => (
 * 				<button type="button">
 * 					{ status === 'success' ? 'Copied!' : 'Copy' }
 * 				</button>
 * 			) }
 * 		</CopyToClipboard>
 * 	);
 * }
 * ```
 */
export function CopyToClipboard( {
	children,
	text,
	timeout = DEFAULT_TIMEOUT,
	onCopy,
}: CopyToClipboardProps ) {
	const [ status, setStatus ] =
		useState< CopyToClipboardStatus >( INITIAL_STATUS );
	const timeoutIdRef = useRef< ReturnType< typeof setTimeout > >( undefined );

	useEffect( () => {
		return () => {
			if ( timeoutIdRef.current !== undefined ) {
				clearTimeout( timeoutIdRef.current );
			}
		};
	}, [] );

	const onSuccess = useEvent( () => {
		const copiedText = typeof text === 'function' ? text() : text || '';
		setStatus( 'success' );
		if ( timeoutIdRef.current !== undefined ) {
			clearTimeout( timeoutIdRef.current );
		}
		timeoutIdRef.current = setTimeout( () => {
			setStatus( INITIAL_STATUS );
		}, timeout );
		onCopy?.( copiedText, true );
	} );

	const copyRef = useCopyToClipboard( text, onSuccess );
	const content =
		typeof children === 'function' ? children( status ) : children;
	const childRef = isValidElement( content )
		? getElementRef( content )
		: null;
	const mergedRef = useMergeRefs( [ copyRef, childRef ] );

	if ( ! isValidElement( content ) ) {
		throw new Error(
			'CopyToClipboard children must be a valid React element or a render function that returns one.'
		);
	}

	return cloneElement( content as ReactElement< Record< string, unknown > >, {
		ref: mergedRef,
	} );
}
