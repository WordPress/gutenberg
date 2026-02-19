/**
 * WordPress dependencies
 */
import { useRef, useLayoutEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useRefEffect from '../use-ref-effect';

/**
 * Copies text to the clipboard using the Clipboard API when available,
 * with a fallback for non-secure contexts (e.g. HTTP) and older browsers.
 *
 * @param {string}       text    The text to copy.
 * @param {Element|null} trigger The element that triggered the copy. Required for
 * @return {Promise<boolean>} Resolves to true if successful, false otherwise.
 */
export async function copyToClipboard( text, trigger ) {
	if ( ! text || ! trigger ) {
		return false;
	}
	const { ownerDocument } = trigger;
	if ( ! ownerDocument ) {
		return false;
	}
	const { defaultView } = ownerDocument;
	try {
		const isSecureContext = defaultView?.isSecureContext;
		// eslint-disable-next-line no-console
		console.log( 'isSecureContext:', isSecureContext );
		if ( defaultView?.navigator?.clipboard?.writeText ) {
			// eslint-disable-next-line no-console
			console.log( 'Clipboard API is available.' );
			await defaultView.navigator.clipboard.writeText( text );
			return true;
		}
		// eslint-disable-next-line no-console
		console.log(
			'Clipboard API is not available. Use execCommand instead.'
		);
		// Fallback for non-secure contexts (HTTP) and older browsers.
		const textarea = ownerDocument.createElement( 'textarea' );
		textarea.value = text;
		textarea.setAttribute( 'readonly', '' );
		textarea.style.position = 'absolute';
		textarea.style.left = '-9999px';
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
 * @param {Element} trigger The element that triggered the copy.
 */
export function clearSelection( trigger ) {
	if ( 'focus' in trigger && typeof trigger.focus === 'function' ) {
		trigger.focus();
	}
	trigger.ownerDocument?.defaultView?.getSelection()?.removeAllRanges();
}

/**
 * @template T
 * @param {T} value
 * @return {React.RefObject<T>} The updated ref
 */
function useUpdatedRef( value ) {
	const ref = useRef( value );
	useLayoutEffect( () => {
		ref.current = value;
	}, [ value ] );
	return ref;
}

/**
 * Copies the given text to the clipboard when the element is clicked.
 *
 * @template {HTMLElement} TElementType
 * @param {string | (() => string)} text      The text to copy. Use a function if not
 *                                            already available and expensive to compute.
 * @param {Function}                onSuccess Called when to text is copied.
 *
 * @return {React.Ref<TElementType>} A ref to assign to the target element.
 */
export default function useCopyToClipboard( text, onSuccess ) {
	const textRef = useUpdatedRef( text );
	const onSuccessRef = useUpdatedRef( onSuccess );
	return useRefEffect( ( node ) => {
		const handleClick = async () => {
			const textToCopy =
				typeof textRef.current === 'function'
					? textRef.current()
					: textRef.current || '';
			const success = await copyToClipboard( textToCopy, node );
			if ( success ) {
				clearSelection( node );
				if ( onSuccessRef.current ) {
					onSuccessRef.current();
				}
			}
		};
		node.addEventListener( 'click', handleClick );
		return () => {
			node.removeEventListener( 'click', handleClick );
		};
	}, [] );
}
