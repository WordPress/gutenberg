/**
 * External dependencies
 */
import { WebView } from 'react-native-webview';

/**
 * WordPress dependencies
 */
import {
	renderToString,
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
		height: 100%;
		overflow: hidden; /* If it has an aspect ratio, it shouldn't scroll. */
	}
	body > div > * {
		margin-top: 0 !important; /* Has to have !important to override inline styles. */
		margin-bottom: 0 !important;
	}
`;

export default function Sandbox( {
	html = '',
	title = '',
	type,
	styles = [],
	scripts = [],
} ) {
	const ref = useRef();
	const [ width, setWidth ] = useState( 0 );
	const [ height, setHeight ] = useState( 0 );
	const [ iframeHtml, setiFrameHtml ] = useState();

	function trySandbox() {
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

		setiFrameHtml( '<!DOCTYPE html>' + renderToString( htmlDoc ) );
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

	function getAspectRatio() {
		const contentWidth = Math.ceil( width );
		const contentHeight = Math.ceil( height );

		if ( contentWidth && contentHeight ) {
			return contentWidth / contentHeight;
		}

		return 1;
	}

	useEffect( () => {
		trySandbox();
	}, [ title, type, styles, scripts ] );

	useEffect( () => {
		trySandbox( true );
	}, [ html ] );

	return (
		<WebView
			ref={ ref }
			source={ { html: iframeHtml } }
			originWhitelist={ [ '*' ] }
			style={ [
				sandboxStyles[ 'sandbox-webview__container' ],
				{
					aspectRatio: getAspectRatio(),
				},
			] }
			onMessage={ checkMessageForResize }
		/>
	);
}
