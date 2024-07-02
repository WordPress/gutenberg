/**
 * External dependencies
 */
import { Dimensions, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * WordPress dependencies
 */
import {
	Platform,
	renderToString,
	memo,
	useRef,
	useState,
	useEffect,
	forwardRef,
	useCallback,
} from '@wordpress/element';
import { usePreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import sandboxStyles from './style.scss';

const observeAndResizeJS = `
	(function() {
		const { MutationObserver } = window;

		if ( ! MutationObserver || ! document.body || ! window.parent ) {
			return;
		}

		function sendResize() {
			const clientBoundingRect = document.body.getBoundingClientRect();

			// The function postMessage is exposed by the react-native-webview library
			// to communicate between React Native and the WebView, in this case,
			// we use it for notifying resize changes.
			window.ReactNativeWebView.postMessage(
				JSON.stringify( {
					action: 'resize',
					width: clientBoundingRect.width,
					height: clientBoundingRect.height,
				} )
			);
		}

		const observer = new MutationObserver( sendResize );
		observer.observe( document.body, {
			attributes: true,
			attributeOldValue: false,
			characterData: true,
			characterDataOldValue: false,
			childList: true,
			subtree: true,
		} );

		window.addEventListener( 'load', sendResize, true );

		// Hack: Remove viewport unit styles, as these are relative
		// the iframe root and interfere with our mechanism for
		// determining the unconstrained page bounds.
		function removeViewportStyles( ruleOrNode ) {
			if ( ruleOrNode.style ) {
				[ 'width', 'height', 'minHeight', 'maxHeight' ].forEach( function (
					style
				) {
					if (
						/^\\d+(vw|vh|svw|lvw|dvw|svh|lvh|dvh|vi|svi|lvi|dvi|vb|svb|lvb|dvb|vmin|svmin|lvmin|dvmin|vmax|svmax|lvmax|dvmax)$/.test( ruleOrNode.style[ style ] )
					) {
						ruleOrNode.style[ style ] = '';
					}
				} );
			}
		}

		Array.prototype.forEach.call(
			document.querySelectorAll( '[style]' ),
			removeViewportStyles
		);
		Array.prototype.forEach.call(
			document.styleSheets,
			function ( stylesheet ) {
				Array.prototype.forEach.call(
					stylesheet.cssRules || stylesheet.rules,
					removeViewportStyles
				);
			}
		);

		document.body.style.position = 'absolute';
		document.body.style.width = '100%';
		document.body.setAttribute( 'data-resizable-iframe-connected', '' );

		sendResize();

		// Resize events can change the width of elements with 100% width, but we don't
		// get an DOM mutations for that, so do the resize when the window is resized, too.
		window.addEventListener( 'resize', sendResize, true );
		window.addEventListener( 'orientationchange', sendResize, true );
	})();
`;

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
	 * These styles have been copied from the web version (https://github.com/WordPress/gutenberg/blob/7901895ca20cf61e402925e31571d659dab64721/packages/block-library/src/embed/style.scss#L42-L89) and
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

const Sandbox = forwardRef( function Sandbox(
	{
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
		onWindowEvents = {},
		viewportProps = '',
		onLoadEnd = () => {},
		testID,
	},
	ref
) {
	const colorScheme = usePreferredColorScheme();
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

		// Avoid comma issues with props.viewportProps.
		const addViewportProps = viewportProps
			.trim()
			.replace( /(^[^,])/, ', $1' );

		const htmlDoc = (
			<html lang={ lang }>
				<head>
					<title>{ title }</title>
					<meta
						name="viewport"
						content={ `width=device-width, initial-scale=1${ addViewportProps }` }
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
					{ scripts.map( ( src ) => (
						<script key={ src } src={ src } />
					) ) }
				</body>
			</html>
		);
		return '<!DOCTYPE html>' + renderToString( htmlDoc );
	}

	const getInjectedJavaScript = useCallback( () => {
		// Allow parent to override the resize observers with prop.customJS (legacy support)
		let injectedJS = customJS || observeAndResizeJS;

		// Add any event listeners that were passed in.
		Object.keys( onWindowEvents ).forEach( ( eventType ) => {
			injectedJS += `
				window.addEventListener( '${ eventType }', function( event ) {
					window.ReactNativeWebView.postMessage( JSON.stringify( { type: '${ eventType }', ...event.data } ) );
				});`;
		} );

		return injectedJS;
	}, [ customJS, onWindowEvents ] );

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

	function getSizeStyle() {
		const contentHeight = Math.ceil( height );

		return contentHeight ? { height: contentHeight } : { aspectRatio: 1 };
	}

	function onChangeDimensions( dimensions ) {
		setIsLandscape( dimensions.window.width >= dimensions.window.height );
	}

	const onMessage = useCallback(
		( message ) => {
			let data = message?.nativeEvent?.data;

			try {
				data = JSON.parse( data );
			} catch ( e ) {
				return;
			}

			// check for resize event
			if ( 'resize' === data?.action ) {
				setHeight( data.height );
			}

			// Forward the event to parent event listeners
			Object.keys( onWindowEvents ).forEach( ( eventType ) => {
				if ( data?.type === eventType ) {
					try {
						onWindowEvents[ eventType ]( data );
					} catch ( e ) {
						// eslint-disable-next-line no-console
						console.warn(
							`Error handling event ${ eventType }`,
							e
						);
					}
				}
			} );
		},
		[ onWindowEvents ]
	);

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
		// Disable reason: deferring this refactor to the native team.
		// see https://github.com/WordPress/gutenberg/pull/41166
		// eslint-disable-next-line react-hooks/exhaustive-deps
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
			injectedJavaScript={ getInjectedJavaScript() }
			key={ key }
			ref={ ref }
			source={ { baseUrl: providerUrl, html: contentHtml } }
			// Wildcard value is required for static HTML
			// Reference: https://github.com/react-native-webview/react-native-webview/blob/master/docs/Reference.md#source
			originWhitelist={ [ '*' ] }
			style={ [
				sandboxStyles[ 'sandbox-webview__content' ],
				getSizeStyle(),
				Platform.isAndroid && workaroundStyles.webView,
			] }
			onMessage={ onMessage }
			scrollEnabled={ false }
			setBuiltInZoomControls={ false }
			showsHorizontalScrollIndicator={ false }
			showsVerticalScrollIndicator={ false }
			mediaPlaybackRequiresUserAction={ false }
			onLoadEnd={ onLoadEnd }
			testID={ testID }
		/>
	);
} );

const workaroundStyles = StyleSheet.create( {
	webView: {
		/**
		 * The slight opacity below is a workaround for an Android crash caused from combining Android
		 * 12's new scroll overflow behavior and webviews.
		 * https://github.com/react-native-webview/react-native-webview/issues/1915#issuecomment-808869253
		 */
		opacity: 0.99,
	},
} );

export default memo( Sandbox );
