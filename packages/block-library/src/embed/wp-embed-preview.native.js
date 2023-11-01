/**
 * WordPress dependencies
 */
import { memo, useMemo } from '@wordpress/element';
import { SandBox } from '@wordpress/components';

/**
 * Checks for WordPress embed events signaling the height change when iframe
 * content loads or iframe's window is resized.  The event is sent from
 * WordPress core via the window.postMessage API.
 *
 * References:
 * window.postMessage: https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
 * WordPress core embed-template on load: https://github.com/WordPress/WordPress/blob/HEAD/wp-includes/js/wp-embed-template.js#L143
 * WordPress core embed-template on resize: https://github.com/WordPress/WordPress/blob/HEAD/wp-includes/js/wp-embed-template.js#L187
 */
const observeAndResizeJS = `
    ( function() {
        if ( ! document.body || ! window.parent ) {
            return;
        }

        function sendResize( { data: { secret, message, value } = {} } ) {
            if (
                [ secret, message, value ].some(
                    ( attribute ) => ! attribute
                ) ||
                message !== 'height'
            ) {
                return;
            }

            document
                .querySelectorAll( 'iframe[data-secret="' + secret + '"' )
                .forEach( ( iframe ) => {  
                    if ( +iframe.height !== value ) {
                        iframe.height = value;
                    }
                } );

            // The function postMessage is exposed by the react-native-webview library 
            // to communicate between React Native and the WebView, in this case, 
            // we use it for notifying resize changes.
            window.ReactNativeWebView.postMessage(JSON.stringify( {
                action: 'resize',
                height: value,
            }));
        }

        window.addEventListener( 'message', sendResize );
} )();`;

function WpEmbedPreview( { html, ...rest } ) {
	const wpEmbedHtml = useMemo( () => {
		const doc = new window.DOMParser().parseFromString( html, 'text/html' );
		const iframe = doc.querySelector( 'iframe' );

		if ( iframe ) {
			iframe.removeAttribute( 'style' );
		}

		const blockQuote = doc.querySelector( 'blockquote' );

		if ( blockQuote ) {
			blockQuote.innerHTML = '';
		}

		return doc.body.innerHTML;
	}, [ html ] );

	return (
		<SandBox
			customJS={ observeAndResizeJS }
			html={ wpEmbedHtml }
			{ ...rest }
		/>
	);
}

export default memo( WpEmbedPreview );
