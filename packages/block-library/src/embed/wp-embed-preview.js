/**
 * WordPress dependencies
 */
import { useMergeRefs, useFocusableIframe } from '@wordpress/compose';
import { useRef, useEffect, useMemo } from '@wordpress/element';

/** @typedef {import('@wordpress/element').WPSyntheticEvent} WPSyntheticEvent */

const attributeMap = {
	class: 'className',
	frameborder: 'frameBorder',
	marginheight: 'marginHeight',
	marginwidth: 'marginWidth',
};

export default function WpEmbedPreview( { html } ) {
	const ref = useRef();
	const props = useMemo( () => {
		const doc = new window.DOMParser().parseFromString( html, 'text/html' );
		const iframe = doc.querySelector( 'iframe' );
		const iframeProps = {};

		if ( ! iframe ) return iframeProps;

		Array.from( iframe.attributes ).forEach( ( { name, value } ) => {
			if ( name === 'style' ) return;
			iframeProps[ attributeMap[ name ] || name ] = value;
		} );

		return iframeProps;
	}, [ html ] );

	useEffect( () => {
		const { ownerDocument } = ref.current;
		const { defaultView } = ownerDocument;

		/**
		 * Checks for WordPress embed events signaling the height change when
		 * iframe content loads or iframe's window is resized.  The event is
		 * sent from WordPress core via the window.postMessage API.
		 *
		 * References:
		 * window.postMessage:
		 * https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
		 * WordPress core embed-template on load:
		 * https://github.com/WordPress/WordPress/blob/HEAD/wp-includes/js/wp-embed-template.js#L143
		 * WordPress core embed-template on resize:
		 * https://github.com/WordPress/WordPress/blob/HEAD/wp-includes/js/wp-embed-template.js#L187
		 *
		 * @param {MessageEvent} event Message event.
		 */
		function resizeWPembeds( { data: { secret, message, value } = {} } ) {
			if ( message !== 'height' || secret !== props[ 'data-secret' ] ) {
				return;
			}

			ref.current.height = value;
		}

		defaultView.addEventListener( 'message', resizeWPembeds );
		return () => {
			defaultView.removeEventListener( 'message', resizeWPembeds );
		};
	}, [] );

	return (
		<div className="wp-block-embed__wrapper">
			<iframe
				ref={ useMergeRefs( [ ref, useFocusableIframe() ] ) }
				title={ props.title }
				{ ...props }
			/>
		</div>
	);
}
