/**
 * External dependencies
 */
import { Dimensions, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * WordPress dependencies
 */
import {
	renderToString,
	memo,
	useRef,
	useState,
	useEffect,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

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
                 .querySelectorAll( \`iframe[data-secret="\${ secret }"\` )
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

const style = `
     body {
         margin: 0;
     }
     html,
     body,
     body > div,
     body > div iframe {
         width: 100%;
     }
     body > div > * {
         margin-top: 0 !important; /* Has to have !important to override inline styles. */
         margin-bottom: 0 !important;
     }
 `;

function WpEmbedPreview( { html, providerUrl = '', title = '', url } ) {
	const ref = useRef();
	const [ height, setHeight ] = useState( 0 );
	const [ contentHtml, setContentHtml ] = useState( getHtmlDoc() );

	const windowSize = Dimensions.get( 'window' );
	const [ isLandscape, setIsLandscape ] = useState(
		windowSize.width >= windowSize.height
	);
	// On Android, we need to recreate the WebView when the device rotates, otherwise it disappears.
	// For this purpose, the key value used in the WebView will change when the device orientation gets updated.
	const key = Platform.select( {
		android: `${ url }-${ isLandscape ? 'landscape' : 'portrait' }`,
		ios: url,
	} );

	function getWPEmbedHtml() {
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
	}

	function getHtmlDoc() {
		// TODO: Use the device's locale
		const lang = 'en';

		// Put the html snippet into a html document, and update the state to refresh the WebView,
		// we can use this in the future to inject custom styles or scripts.
		// Scripts go into the body rather than the head, to support embedded content such as Instagram
		// that expect the scripts to be part of the body.
		const htmlDoc = (
			<html lang={ lang }>
				<head>
					<title>{ title }</title>
					<meta
						name="viewport"
						content="width=device-width, initial-scale=1"
					></meta>
					<style
						dangerouslySetInnerHTML={ {
							__html: style,
						} }
					/>
				</head>
				<body>
					<div
						dangerouslySetInnerHTML={ {
							__html: getWPEmbedHtml(),
						} }
					/>
					<script
						type="text/javascript"
						dangerouslySetInnerHTML={ {
							__html: observeAndResizeJS,
						} }
					/>
				</body>
			</html>
		);
		return '<!DOCTYPE html>' + renderToString( htmlDoc );
	}

	function updateContentHtml( forceRerender = false ) {
		const newContentHtml = getHtmlDoc();

		if ( forceRerender && contentHtml === newContentHtml ) {
			// The re-render is forced by updating the state with empty HTML,
			// waiting for the JS code to be executed with "setImmediate" and then
			// setting the content HTML again.
			setContentHtml( '' );
			setImmediate( () => setContentHtml( newContentHtml ) );
		} else {
			setContentHtml( newContentHtml );
		}
	}

	function checkMessageForResize( event ) {
		// Attempt to parse the message data as JSON if passed as string
		let data = event.nativeEvent.data || {};

		if ( 'string' === typeof data ) {
			try {
				data = JSON.parse( data );
			} catch ( e ) {}
		}

		// Update the state only if the message is formatted as we expect,
		// i.e. as an object with a 'resize' action.
		if ( 'resize' !== data.action ) {
			return;
		}

		setHeight( data.height );
	}

	function getSizeStyle() {
		const contentHeight = Math.ceil( height );

		if ( contentHeight ) {
			return { height: contentHeight };
		}

		return { aspectRatio: 1 };
	}

	function onChangeDimensions( dimensions ) {
		setIsLandscape( dimensions.window.width >= dimensions.window.height );
	}

	useEffect( () => {
		Dimensions.addEventListener( 'change', onChangeDimensions );
		return () => {
			Dimensions.removeEventListener( 'change', onChangeDimensions );
		};
	}, [] );

	useEffect( () => {
		updateContentHtml();
	}, [ html, title ] );

	return (
		<WebView
			key={ key }
			ref={ ref }
			source={ {
				baseUrl: providerUrl,
				html: contentHtml,
			} }
			// Wildcard value is required for static HTML
			// Reference: https://github.com/react-native-webview/react-native-webview/blob/master/docs/Reference.md#source
			originWhitelist={ [ '*' ] }
			style={ [ styles[ 'wp-embed__wrapper' ], getSizeStyle() ] }
			onMessage={ checkMessageForResize }
		/>
	);
}

export default memo( WpEmbedPreview );
