/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';

export default function FocusableIframe( { iframeRef, onFocus, ...props } ) {
	const fallbackRef = useRef();
	const ref = useMergeRefs( [ iframeRef, fallbackRef ] );

	useEffect( () => {
		const iframe = fallbackRef.current;
		const { ownerDocument } = iframe;
		const { defaultView } = ownerDocument;
		const { FocusEvent } = defaultView;

		/**
		 * Checks whether the iframe is the activeElement, inferring that it has
		 * then received focus, and calls the `onFocus` prop callback.
		 */
		function checkFocus() {
			if ( ownerDocument.activeElement !== iframe ) {
				return;
			}

			const focusEvent = new FocusEvent( 'focus', { bubbles: true } );

			iframe.dispatchEvent( focusEvent );

			if ( onFocus ) {
				onFocus( focusEvent );
			}
		}

		defaultView.addEventListener( 'blur', checkFocus );

		return () => {
			defaultView.removeEventListener( 'blur', checkFocus );
		};
	}, [ onFocus ] );

	// Disable reason: The rendered iframe is a pass-through component,
	// assigning props inherited from the rendering parent. It's the
	// responsibility of the parent to assign a title.
	// eslint-disable-next-line jsx-a11y/iframe-has-title
	return <iframe ref={ ref } { ...props } />;
}
