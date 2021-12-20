/**
 * WordPress dependencies
 */
import {
	renderToString,
	useRef,
	useState,
	useEffect,
} from '@wordpress/element';
import { useFocusableIframe, useMergeRefs } from '@wordpress/compose';

const observeAndResizeJS = `
	( function() {
		var observer;

		if ( ! window.MutationObserver || ! document.body || ! window.parent ) {
			return;
		}

		function sendResize() {
			var clientBoundingRect = document.body.getBoundingClientRect();

			window.parent.postMessage( {
				action: 'resize',
				width: clientBoundingRect.width,
				height: clientBoundingRect.height,
			}, '*' );
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
	onFocus,
} ) {
	const ref = useRef();
	const [ width, setWidth ] = useState( 0 );
	const [ height, setHeight ] = useState( 0 );

	function isFrameAccessible() {
		try {
			return !! ref.current.contentDocument.body;
		} catch ( e ) {
			return false;
		}
	}

	function trySandbox( forceRerender = false ) {
		if ( ! isFrameAccessible() ) {
			return;
		}

		const { contentDocument, ownerDocument } = ref.current;
		const { body } = contentDocument;

		if (
			! forceRerender &&
			null !== body.getAttribute( 'data-resizable-iframe-connected' )
		) {
			return;
		}

		// put the html snippet into a html document, and then write it to the iframe's document
		// we can use this in the future to inject custom styles or scripts.
		// Scripts go into the body rather than the head, to support embedded content such as Instagram
		// that expect the scripts to be part of the body.
		const htmlDoc = (
			<html
				lang={ ownerDocument.documentElement.lang }
				className={ type }
			>
				<head>
					<title>{ title }</title>
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

		// writing the document like this makes it act in the same way as if it was
		// loaded over the network, so DOM creation and mutation, script execution, etc.
		// all work as expected
		contentDocument.open();
		contentDocument.write( '<!DOCTYPE html>' + renderToString( htmlDoc ) );
		contentDocument.close();
	}

	useEffect( () => {
		trySandbox();

		function tryNoForceSandbox() {
			trySandbox( false );
		}

		function checkMessageForResize( event ) {
			const iframe = ref.current;

			// Verify that the mounted element is the source of the message
			if ( ! iframe || iframe.contentWindow !== event.source ) {
				return;
			}

			// Attempt to parse the message data as JSON if passed as string
			let data = event.data || {};

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

		const { ownerDocument } = ref.current;
		const { defaultView } = ownerDocument;

		// This used to be registered using <iframe onLoad={} />, but it made the iframe blank
		// after reordering the containing block. See these two issues for more details:
		// https://github.com/WordPress/gutenberg/issues/6146
		// https://github.com/facebook/react/issues/18752
		ref.current.addEventListener( 'load', tryNoForceSandbox, false );
		defaultView.addEventListener( 'message', checkMessageForResize );

		return () => {
			ref.current?.removeEventListener(
				'load',
				tryNoForceSandbox,
				false
			);
			defaultView.addEventListener( 'message', checkMessageForResize );
		};
	}, [] );

	useEffect( () => {
		trySandbox();
	}, [ title, type, styles, scripts ] );

	useEffect( () => {
		trySandbox( true );
	}, [ html ] );

	return (
		<iframe
			ref={ useMergeRefs( [ ref, useFocusableIframe() ] ) }
			title={ title }
			className="components-sandbox"
			sandbox="allow-scripts allow-same-origin allow-presentation"
			onFocus={ onFocus }
			width={ Math.ceil( width ) }
			height={ Math.ceil( height ) }
		/>
	);
}
