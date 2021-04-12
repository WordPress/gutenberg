/**
 * WordPress dependencies
 */
import { useRef, useEffect, useMemo } from '@wordpress/element';

/** @typedef {import('@wordpress/element').WPSyntheticEvent} WPSyntheticEvent */

export default function WpEmbedPreview( { html } ) {
	const ref = useRef();

	useEffect( () => {
		const { ownerDocument } = ref.current;
		const { defaultView } = ownerDocument;

		/**
		 * Checks for WordPress embed events signaling the height change when iframe
		 * content loads or iframe's window is resized.  The event is sent from
		 * WordPress core via the window.postMessage API.
		 *
		 * References:
		 * window.postMessage: https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
		 * WordPress core embed-template on load: https://github.com/WordPress/WordPress/blob/HEAD/wp-includes/js/wp-embed-template.js#L143
		 * WordPress core embed-template on resize: https://github.com/WordPress/WordPress/blob/HEAD/wp-includes/js/wp-embed-template.js#L187
		 *
		 * @param {WPSyntheticEvent} event Message event.
		 */
		function resizeWPembeds( { data: { secret, message, value } = {} } ) {
			if (
				[ secret, message, value ].some(
					( attribute ) => ! attribute
				) ||
				message !== 'height'
			) {
				return;
			}

			ownerDocument
				.querySelectorAll( `iframe[data-secret="${ secret }"` )
				.forEach( ( iframe ) => {
					if ( +iframe.height !== value ) {
						iframe.height = value;
					}
				} );
		}

		/**
		 * Checks whether the wp embed iframe is the activeElement,
		 * if it is dispatch a focus event.
		 */
		function checkFocus() {
			const { activeElement } = ownerDocument;

			if (
				activeElement.tagName !== 'IFRAME' ||
				activeElement.parentNode !== ref.current
			) {
				return;
			}

			activeElement.focus();
		}

		defaultView.addEventListener( 'message', resizeWPembeds );
		defaultView.addEventListener( 'blur', checkFocus );

		return () => {
			defaultView.removeEventListener( 'message', resizeWPembeds );
			defaultView.removeEventListener( 'blur', checkFocus );
		};
	}, [] );

	const __html = useMemo( () => {
		const doc = new window.DOMParser().parseFromString( html, 'text/html' );
		const iframe = doc.querySelector( 'iframe' );

		if ( iframe ) {
			iframe.removeAttribute( 'style' );
		}

		const blockQuote = doc.querySelector( 'blockquote' );

		if ( blockQuote ) {
			blockQuote.style.display = 'none';
		}

		return doc.body.innerHTML;
	}, [ html ] );

	return (
		<div
			ref={ ref }
			className="wp-block-embed__wrapper"
			dangerouslySetInnerHTML={ { __html } }
		/>
	);
}
