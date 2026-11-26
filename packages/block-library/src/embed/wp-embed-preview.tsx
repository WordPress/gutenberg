import { useMergeRefs, useFocusableIframe } from '@wordpress/compose';
import { useRef, useEffect, useMemo } from '@wordpress/element';
import type { WpEmbedMessage, WpEmbedPreviewProps } from './types';

const attributeMap: Record< string, string > = {
	class: 'className',
	frameborder: 'frameBorder',
	marginheight: 'marginHeight',
	marginwidth: 'marginWidth',
};

export default function WpEmbedPreview( { html }: WpEmbedPreviewProps ) {
	const ref = useRef< HTMLIFrameElement >( undefined );
	const props = useMemo( () => {
		// `parseFromString` converts `undefined` to the string "undefined".
		const doc = new window.DOMParser().parseFromString(
			html as string,
			'text/html'
		);
		const iframe = doc.querySelector( 'iframe' );
		const iframeProps: Record< string, string > = {};

		if ( ! iframe ) {
			return iframeProps;
		}

		Array.from( iframe.attributes ).forEach( ( { name, value } ) => {
			if ( name === 'style' ) {
				return;
			}
			iframeProps[ attributeMap[ name ] || name ] = value;
		} );

		return iframeProps;
	}, [ html ] );

	useEffect( () => {
		// Effects run after the iframe mounts and sets the ref.
		const { ownerDocument } = ref.current!;
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
		 * @param event      Message event.
		 * @param event.data Message data, which any window can post.
		 */
		function resizeWPembeds( { data }: MessageEvent< unknown > ) {
			// Messages from other sources may carry `null` or a primitive.
			const { secret, message, value } = ( data ?? {} ) as WpEmbedMessage;
			if ( message !== 'height' || secret !== props[ 'data-secret' ] ) {
				return;
			}

			// The listener is removed before the iframe unmounts, and the
			// `height` property converts the number to a string.
			ref.current!.height = value as unknown as string;
		}

		// A mounted element's document always has a window.
		defaultView!.addEventListener( 'message', resizeWPembeds );
		return () => {
			// A mounted element's document always has a window.
			defaultView!.removeEventListener( 'message', resizeWPembeds );
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
