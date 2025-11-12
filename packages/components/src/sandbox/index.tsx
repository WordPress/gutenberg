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

/**
 * Internal dependencies
 */
import type { SandBoxProps } from './types';

const observeAndResizeJS = function () {
	const { MutationObserver } = window;

	if ( ! MutationObserver || ! document.body || ! window.parent ) {
		return;
	}

	function sendResize() {
		const clientBoundingRect = document.body.getBoundingClientRect();

		window.parent.postMessage(
			{
				action: 'resize',
				width: clientBoundingRect.width,
				height: clientBoundingRect.height,
			},
			'*'
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
	function removeViewportStyles( ruleOrNode: ElementCSSInlineStyle ) {
		if ( ruleOrNode.style ) {
			(
				[ 'width', 'height', 'minHeight', 'maxHeight' ] as const
			 ).forEach( function ( style ) {
				if (
					/^\\d+(vw|vh|svw|lvw|dvw|svh|lvh|dvh|vi|svi|lvi|dvi|vb|svb|lvb|dvb|vmin|svmin|lvmin|dvmin|vmax|svmax|lvmax|dvmax)$/.test(
						ruleOrNode.style[ style ]
					)
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
};

// TODO: These styles shouldn't be coupled with WordPress.
const style = `
	body {
		margin: 0;
	}
	html,
	body,
	body > div {
		width: 100%;
	}
	html.wp-has-aspect-ratio,
	body.wp-has-aspect-ratio,
	body.wp-has-aspect-ratio > div,
	body.wp-has-aspect-ratio > div iframe {
		width: 100%;
		height: 100%;
		overflow: hidden; /* If it has an aspect ratio, it shouldn't scroll. */
	}
	body > div > * {
		margin-top: 0 !important; /* Has to have !important to override inline styles. */
		margin-bottom: 0 !important;
	}
`;

/**
 * This component provides an isolated environment for arbitrary HTML via iframes.
 *
 * ```jsx
 * import { SandBox } from '@wordpress/components';
 *
 * const MySandBox = () => (
 * 	<SandBox html="<p>Content</p>" title="SandBox" type="embed" />
 * );
 * ```
 */
function SandBox( {
	html = '',
	title = '',
	type,
	styles = [],
	scripts = [],
	onFocus,
	tabIndex,
}: SandBoxProps ) {
	const ref = useRef< HTMLIFrameElement >();
	const [ width, setWidth ] = useState( 0 );
	const [ height, setHeight ] = useState( 0 );

	function isFrameAccessible() {
		try {
			return !! ref.current?.contentDocument?.body;
		} catch ( e ) {
			return false;
		}
	}

	function trySandBox( forceRerender = false ) {
		if ( ! isFrameAccessible() ) {
			return;
		}

		const { contentDocument, ownerDocument } =
			ref.current as HTMLIFrameElement & {
				contentDocument: Document;
			};

		if (
			! forceRerender &&
			null !==
				contentDocument?.body.getAttribute(
					'data-resizable-iframe-connected'
				)
		) {
			return;
		}

		// Put the html snippet into a html document, and then write it to the iframe's document
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
							__html: `(${ observeAndResizeJS.toString() })();`,
						} }
					/>
					{ scripts.map( ( src ) => (
						<script key={ src } src={ src } />
					) ) }
				</body>
			</html>
		);

		// Writing the document like this makes it act in the same way as if it was
		// loaded over the network, so DOM creation and mutation, script execution, etc.
		// all work as expected.
		contentDocument.open();
		contentDocument.write( '<!DOCTYPE html>' + renderToString( htmlDoc ) );
		contentDocument.close();
	}

	useEffect( () => {
		trySandBox();

		function tryNoForceSandBox() {
			trySandBox( false );
		}

		function checkMessageForResize( event: MessageEvent ) {
			const iframe = ref.current;

			// Verify that the mounted element is the source of the message.
			if ( ! iframe || iframe.contentWindow !== event.source ) {
				return;
			}

			// Attempt to parse the message data as JSON if passed as string.
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

		const iframe = ref.current;
		const defaultView = iframe?.ownerDocument?.defaultView;

		// This used to be registered using <iframe onLoad={} />, but it made the iframe blank
		// after reordering the containing block. See these two issues for more details:
		// https://github.com/WordPress/gutenberg/issues/6146
		// https://github.com/facebook/react/issues/18752
		iframe?.addEventListener( 'load', tryNoForceSandBox, false );
		defaultView?.addEventListener( 'message', checkMessageForResize );

		return () => {
			iframe?.removeEventListener( 'load', tryNoForceSandBox, false );
			defaultView?.removeEventListener(
				'message',
				checkMessageForResize
			);
		};
		// Passing `exhaustive-deps` will likely involve a more detailed refactor.
		// See https://github.com/WordPress/gutenberg/pull/44378
	}, [] );

	useEffect( () => {
		trySandBox();
		// Passing `exhaustive-deps` will likely involve a more detailed refactor.
		// See https://github.com/WordPress/gutenberg/pull/44378
	}, [ title, styles, scripts ] );

	useEffect( () => {
		trySandBox( true );
		// Passing `exhaustive-deps` will likely involve a more detailed refactor.
		// See https://github.com/WordPress/gutenberg/pull/44378
	}, [ html, type ] );

	return (
		<iframe
			ref={ useMergeRefs( [ ref, useFocusableIframe() ] ) }
			title={ title }
			tabIndex={ tabIndex }
			className="components-sandbox"
			sandbox="allow-scripts allow-same-origin allow-presentation"
			onFocus={ onFocus }
			width={ Math.ceil( width ) }
			height={ Math.ceil( height ) }
		/>
	);
}

export default SandBox;
