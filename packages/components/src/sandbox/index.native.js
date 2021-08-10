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
import sandboxStyles from './style.scss';

const observeAndResizeJS = `
	( function() {
		var observer;

		if ( ! window.MutationObserver || ! document.body || ! window.parent ) {
			return;
		}

		function sendResize() {
			var clientBoundingRect = document.body.getBoundingClientRect();

			// The function postMessage is exposed by the react-native-webview library 
			// to communicate between React Native and the WebView, in this case, 
			// we use it for notifying resize changes.
            window.ReactNativeWebView.postMessage(JSON.stringify( {
                action: 'resize',
				width: clientBoundingRect.width,
				height: clientBoundingRect.height,
            }));
		}

		observer = new MutationObserver( sendResize );
		observer.observe( document.body, {
			attributes: true,
			attributeOldValue: false,
			characterData: true,
			characterDataOldValue: false,
			childList: true,
			subtree: true
		} );

		window.addEventListener( 'load', sendResize, true );

		// Hack: Remove viewport unit styles, as these are relative
		// the iframe root and interfere with our mechanism for
		// determining the unconstrained page bounds.
		function removeViewportStyles( ruleOrNode ) {
			if( ruleOrNode.style ) {
				[ 'width', 'height', 'minHeight', 'maxHeight' ].forEach( function( style ) {
					if ( /^\\d+(vmin|vmax|vh|vw)$/.test( ruleOrNode.style[ style ] ) ) {
						ruleOrNode.style[ style ] = '';
					}
				} );
			}
		}

		Array.prototype.forEach.call( document.querySelectorAll( '[style]' ), removeViewportStyles );
		Array.prototype.forEach.call( document.styleSheets, function( stylesheet ) {
			Array.prototype.forEach.call( stylesheet.cssRules || stylesheet.rules, removeViewportStyles );
		} );

		document.body.style.position = 'absolute';
		document.body.style.width = '100%';
		document.body.setAttribute( 'data-resizable-iframe-connected', '' );

		sendResize();

		// Resize events can change the width of elements with 100% width, but we don't
		// get an DOM mutations for that, so do the resize when the window is resized, too.
		window.addEventListener( 'resize', sendResize, true );
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
	html.wp-has-aspect-ratio,
	body.wp-has-aspect-ratio,
	body.wp-has-aspect-ratio > div,
	body.wp-has-aspect-ratio > div iframe {
		height: auto;
		overflow: hidden; /* If it has an aspect ratio, it shouldn't scroll. */
	}
	body > div > * {
		margin-top: 0 !important; /* Has to have !important to override inline styles. */
		margin-bottom: 0 !important;
	}
`;

const EMPTY_ARRAY = [];

function Sandbox( {
	html = '',
	providerUrl = '',
	scripts = EMPTY_ARRAY,
	styles = EMPTY_ARRAY,
	title = '',
	type,
	url,
} ) {
	const ref = useRef();
	const [ width, setWidth ] = useState( 0 );
	const [ height, setHeight ] = useState( 0 );
	const [ contentHtml, setContentHtml ] = useState( getHtmlDoc() );

	const windowSize = Dimensions.get( 'window' );
	const [ isLandscape, setIsLandscape ] = useState(
		windowSize.width >= windowSize.height
	);
	const wasLandscape = useRef( isLandscape );
	// On Android, we need to recreate the WebView when the device rotates, otherwise it disappears.
	// For this purpose, the key value used in the WebView will change when the device orientation gets updated.
	const key = Platform.select( {
		android: `${ url }-${ isLandscape ? 'landscape' : 'portrait' }`,
		ios: url,
	} );

	function getHtmlDoc() {
		// TODO: Use the device's locale
		const lang = 'en';

		// Put the html snippet into a html document, and update the state to refresh the WebView,
		// we can use this in the future to inject custom styles or scripts.
		// Scripts go into the body rather than the head, to support embedded content such as Instagram
		// that expect the scripts to be part of the body.
		const htmlDoc = (
			<html lang={ lang } className={ type }>
				<head>
					<title>{ title }</title>
					<meta
						name="viewport"
						content="width=device-width, initial-scale=1"
					></meta>
					<style dangerouslySetInnerHTML={ { __html: style } } />
					{ styles.map( ( rules, i ) => (
						<style
							key={ i }
							dangerouslySetInnerHTML={ { __html: rules } }
						/>
					) ) }
				</head>
				<body
					data-resizable-iframe-connected="data-resizable-iframe-connected"
					className={ type }
				>
					<div dangerouslySetInnerHTML={ { __html: html } } />
					<script
						type="text/javascript"
						dangerouslySetInnerHTML={ {
							__html: observeAndResizeJS,
						} }
					/>
					{ scripts.map( ( src ) => (
						<script key={ src } src={ src } />
					) ) }
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

		setWidth( data.width );
		setHeight( data.height );
	}

	function getSizeStyle() {
		const contentWidth = Math.ceil( width );
		const contentHeight = Math.ceil( height );

		if ( contentWidth && contentHeight ) {
			return { width: contentWidth, height: contentHeight };
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
	}, [ html, title, type, styles, scripts ] );

	useEffect( () => {
		// When device orientation changes we have to recalculate the size,
		// for this purpose we reset the current size value.
		if ( wasLandscape.current !== isLandscape ) {
			setWidth( 0 );
			setHeight( 0 );
		}
		wasLandscape.current = isLandscape;
	}, [ isLandscape ] );

	return (
		<WebView
			key={ key }
			ref={ ref }
			source={ { baseUrl: providerUrl, html: contentHtml } }
			// Wildcard value is required for static HTML
			// Reference: https://github.com/react-native-webview/react-native-webview/blob/master/docs/Reference.md#source
			originWhitelist={ [ '*' ] }
			style={ [
				sandboxStyles[ 'sandbox-webview__container' ],
				getSizeStyle(),
			] }
			onMessage={ checkMessageForResize }
		/>
	);
}

export default memo( Sandbox );
