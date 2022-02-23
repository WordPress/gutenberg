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
import { usePreferredColorScheme } from '@wordpress/compose';

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
	body > div > * {
		margin-top: 0 !important; /* Has to have !important to override inline styles. */
		margin-bottom: 0 !important;
	}

	.wp-block-embed__wrapper {
		position: relative;
	}

	body.wp-has-aspect-ratio > div iframe {
		height: 100%;
		overflow: hidden; /* If it has an aspect ratio, it shouldn't scroll. */
	}

	/**
	 * Add responsiveness to embeds with aspect ratios.
	 *
	 * These styles have been copied from the web version (https://git.io/JEFcX) and
	 * adapted for the native version.
	 */
	.wp-has-aspect-ratio.wp-block-embed__wrapper::before {
		content: "";
		display: block;
		padding-top: 50%; // Default to 2:1 aspect ratio.
	}
	.wp-has-aspect-ratio iframe {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		height: 100%;
		width: 100%;
	}
	.wp-embed-aspect-21-9.wp-block-embed__wrapper::before {
		padding-top: 42.85%; // 9 / 21 * 100
	}
	.wp-embed-aspect-18-9.wp-block-embed__wrapper::before {
		padding-top: 50%; // 9 / 18 * 100
	}
	.wp-embed-aspect-16-9.wp-block-embed__wrapper::before {
		padding-top: 56.25%; // 9 / 16 * 100
	}
	.wp-embed-aspect-4-3.wp-block-embed__wrapper::before {
		padding-top: 75%; // 3 / 4 * 100
	}
	.wp-embed-aspect-1-1.wp-block-embed__wrapper::before {
		padding-top: 100%; // 1 / 1 * 100
	}
	.wp-embed-aspect-9-16.wp-block-embed__wrapper::before {
		padding-top: 177.77%; // 16 / 9 * 100
	}
	.wp-embed-aspect-1-2.wp-block-embed__wrapper::before {
		padding-top: 200%; // 2 / 1 * 100
	}
`;

const EMPTY_ARRAY = [];

function Sandbox( {
	containerStyle,
	customJS,
	html = '',
	lang = 'en',
	providerUrl = '',
	scripts = EMPTY_ARRAY,
	styles = EMPTY_ARRAY,
	title = '',
	type,
	url,
} ) {
	const colorScheme = usePreferredColorScheme();
	const ref = useRef();
	const [ height, setHeight ] = useState( 0 );
	const [ contentHtml, setContentHtml ] = useState( getHtmlDoc() );

	const windowSize = Dimensions.get( 'window' );
	const [ isLandscape, setIsLandscape ] = useState(
		windowSize.width >= windowSize.height
	);
	const wasLandscape = useRef( isLandscape );
	// On Android, we need to recreate the WebView on any of the following actions, otherwise it disappears:
	// - Device rotation
	// - Light/dark mode changes
	// For this purpose, the key prop used in the WebView will be updated with the value of the actions.
	const key = Platform.select( {
		android: `${ url }-${
			isLandscape ? 'landscape' : 'portrait'
		}-${ colorScheme }`,
		ios: url,
	} );

	function getHtmlDoc() {
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
							__html: customJS || observeAndResizeJS,
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

		setHeight( data.height );
	}

	function getSizeStyle() {
		const contentHeight = Math.ceil( height );

		return contentHeight ? { height: contentHeight } : { aspectRatio: 1 };
	}

	function onChangeDimensions( dimensions ) {
		setIsLandscape( dimensions.window.width >= dimensions.window.height );
	}

	useEffect( () => {
		const dimensionsChangeSubscription = Dimensions.addEventListener(
			'change',
			onChangeDimensions
		);
		return () => {
			dimensionsChangeSubscription.remove();
		};
	}, [] );

	useEffect( () => {
		updateContentHtml();
	}, [ html, title, type, styles, scripts ] );

	useEffect( () => {
		// When device orientation changes we have to recalculate the size,
		// for this purpose we reset the current size value.
		if ( wasLandscape.current !== isLandscape ) {
			setHeight( 0 );
		}
		wasLandscape.current = isLandscape;
	}, [ isLandscape ] );

	return (
		<WebView
			containerStyle={ [
				sandboxStyles[ 'sandbox-webview__container' ],
				containerStyle,
			] }
			key={ key }
			ref={ ref }
			source={ { baseUrl: providerUrl, html: contentHtml } }
			// Wildcard value is required for static HTML
			// Reference: https://github.com/react-native-webview/react-native-webview/blob/master/docs/Reference.md#source
			originWhitelist={ [ '*' ] }
			style={ [
				sandboxStyles[ 'sandbox-webview__content' ],
				getSizeStyle(),
			] }
			onMessage={ checkMessageForResize }
			scrollEnabled={ false }
			setBuiltInZoomControls={ false }
			showsHorizontalScrollIndicator={ false }
			showsVerticalScrollIndicator={ false }
		/>
	);
}

export default memo( Sandbox );
