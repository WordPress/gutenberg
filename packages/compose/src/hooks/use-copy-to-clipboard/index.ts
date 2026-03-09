/**
 * WordPress dependencies
 */
import { useRef, useLayoutEffect } from '@wordpress/element';
import type { MutableRefObject, RefCallback } from 'react';

/**
 * Internal dependencies
 */
import useRefEffect from '../use-ref-effect';

/**
 * Copies text to the clipboard using the Clipboard API when available,
 * with a fallback for non-secure contexts (e.g. HTTP) and older browsers.
 *
 * @param text    The text to copy.
 * @param trigger The element that triggered the copy.
 * @return Resolves to true if successful, false otherwise.
 */
export async function copyToClipboard(
	text: string,
	trigger: Element | null
): Promise< boolean > {
	if ( ! trigger ) {
		return false;
	}
	const { ownerDocument } = trigger;
	if ( ! ownerDocument ) {
		return false;
	}
	const { defaultView } = ownerDocument;
	try {
		if ( defaultView?.navigator?.clipboard?.writeText ) {
			await defaultView.navigator.clipboard.writeText( text );
			return true;
		}
		// Fallback for non-secure contexts (HTTP) and older browsers.
		const textarea = ownerDocument.createElement( 'textarea' );
		textarea.value = text;
		textarea.setAttribute( 'readonly', '' );
		textarea.style.position = 'fixed';
		textarea.style.left = '-9999px';
		textarea.style.top = '-9999px';
		ownerDocument.body.appendChild( textarea );
		textarea.select();
		const success = ownerDocument.execCommand( 'copy' );
		textarea.remove();
		return success;
	} catch {
		return false;
	}
}

/**
 * Clears the current selection and restores focus to the trigger element.
 *
 * @param trigger The element that triggered the copy.
 */
export function clearSelection( trigger: Element ): void {
	if ( 'focus' in trigger && typeof trigger.focus === 'function' ) {
		trigger.focus();
	}
	trigger.ownerDocument?.defaultView?.getSelection()?.removeAllRanges();
}

/**
 * @template T
 * @param    value
 * @return   A ref to assign to the target element.
 */
function useUpdatedRef< T >( value: T ): MutableRefObject< T > {
	const ref = useRef< T >( value );
	useLayoutEffect( () => {
		ref.current = value;
	}, [ value ] );
	return ref;
}

/**
 * Copies the given text to the clipboard when the element is clicked.
 *
 * @template T
 * @param    text      The text to copy. Use a function if not
 *                     already available and expensive to compute.
 * @param    onSuccess Called when to text is copied.
 *
 * @return   A ref to assign to the target element.
 */
export default function useCopyToClipboard< T extends HTMLElement >(
	text: string | ( () => string ),
	onSuccess?: () => void
): RefCallback< T > {
	const textRef = useUpdatedRef( text );
	const onSuccessRef = useUpdatedRef( onSuccess );
	return useRefEffect( ( node ) => {
		// Flag to prevent callbacks after unmount when the Promise resolves.
		let isActive = true;
		const handleClick = async () => {
			const textToCopy =
				typeof textRef.current === 'function'
					? textRef.current()
					: textRef.current || '';
			const success = await copyToClipboard( textToCopy, node );
			if ( ! isActive ) {
				return;
			}
			if ( success ) {
				clearSelection( node );
				if ( onSuccessRef.current ) {
					onSuccessRef.current();
				}
			}
		};
		node.addEventListener( 'click', handleClick );
		return () => {
			isActive = false;
			node.removeEventListener( 'click', handleClick );
		};
	}, [] );
}
