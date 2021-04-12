/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';

export default function FocusableIframe( { iframeRef, ...props } ) {
	const fallbackRef = useRef();
	const ref = useMergeRefs( [ iframeRef, fallbackRef ] );

	useEffect( () => {
		const iframe = fallbackRef.current;
		const { ownerDocument } = iframe;
		const { defaultView } = ownerDocument;

		/**
		 * Checks whether the iframe is the activeElement, inferring that it has
		 * then received focus, and calls the `onFocus` prop callback.
		 */
		function checkFocus() {
			if ( ownerDocument.activeElement !== iframe ) {
				return;
			}

			iframe.focus();
		}

		defaultView.addEventListener( 'blur', checkFocus );

		return () => {
			defaultView.removeEventListener( 'blur', checkFocus );
		};
	}, [] );

	// Disable reason: The rendered iframe is a pass-through component,
	// assigning props inherited from the rendering parent. It's the
	// responsibility of the parent to assign a title.
	// eslint-disable-next-line jsx-a11y/iframe-has-title
	return <iframe ref={ ref } { ...props } />;
}
