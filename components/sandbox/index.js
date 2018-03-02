/**
 * WordPress dependencies
 */
import { Component, renderToString } from '@wordpress/element';

export default class Sandbox extends Component {
	constructor() {
		super( ...arguments );

		this.trySandbox = this.trySandbox.bind( this );
		this.checkMessageForResize = this.checkMessageForResize.bind( this );
		this.checkFocus = this.checkFocus.bind( this );

		this.state = {
			width: 0,
			height: 0,
		};
	}

	isFrameAccessible() {
		try {
			return !! this.iframe.contentDocument.body;
		} catch ( e ) {
			return false;
		}
	}

	checkMessageForResize( event ) {
		const iframe = this.iframe;

		// Attempt to parse the message data as JSON if passed as string
		let data = event.data || {};
		if ( 'string' === typeof data ) {
			try {
				data = JSON.parse( data );
			} catch ( e ) {} // eslint-disable-line no-empty
		}

		// Verify that the mounted element is the source of the message
		if ( ! iframe || iframe.contentWindow !== event.source ) {
			return;
		}

		// Update the state only if the message is formatted as we expect, i.e.
		// as an object with a 'resize' action, width, and height
		const { action, width, height } = data;
		const { width: oldWidth, height: oldHeight } = this.state;

		if ( 'resize' === action && ( oldWidth !== width || oldHeight !== height ) ) {
			this.setState( { width, height } );
		}
	}

	componentDidMount() {
		window.addEventListener( 'message', this.checkMessageForResize, false );
		window.addEventListener( 'blur', this.checkFocus );
		this.trySandbox();
	}

	componentDidUpdate() {
		this.trySandbox();
	}

	componentWillUnmount() {
		window.removeEventListener( 'message', this.checkMessageForResize );
		window.removeEventListener( 'blur', this.checkFocus );
	}

	checkFocus() {
		if ( this.props.onFocus && document.activeElement === this.iframe ) {
			this.props.onFocus();
		}
	}

	trySandbox() {
		if ( ! this.isFrameAccessible() ) {
			return;
		}

		const body = this.iframe.contentDocument.body;
		if ( null !== body.getAttribute( 'data-resizable-iframe-connected' ) ) {
			return;
		}

		// sandboxing video content needs to explicitly set the height of the sandbox
		// based on a 16:9 ratio for the content to be responsive
		const heightCalculation = 'video' === this.props.type ? 'clientBoundingRect.width / 16 * 9' : 'clientBoundingRect.height';

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
						height: ${ heightCalculation }
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
					[ 'width', 'height', 'minHeight', 'maxHeight' ].forEach( function( style ) {
						if ( /^\\d+(vmin|vmax|vh|vw)$/.test( ruleOrNode.style[ style ] ) ) {
							ruleOrNode.style[ style ] = '';
						}
					} );
				}

				Array.prototype.forEach.call( document.querySelectorAll( '[style]' ), removeViewportStyles );
				Array.prototype.forEach.call( document.styleSheets, function( stylesheet ) {
					Array.prototype.forEach.call( stylesheet.cssRules || stylesheet.rules, removeViewportStyles );
				} );

				document.body.style.position = 'absolute';
				document.body.style.width = '100%';
				document.body.setAttribute( 'data-resizable-iframe-connected', '' );

				sendResize();
		} )();`;

		const style = `
			body {
				margin: 0;
			}
			body.video,
			body.video > div,
			body.video > div > iframe {
				width: 100%;
				height: 100%;
			}
			body > div > * {
				margin-top: 0 !important;	/* has to have !important to override inline styles */
				margin-bottom: 0 !important;
			}
		`;

		// put the html snippet into a html document, and then write it to the iframe's document
		// we can use this in the future to inject custom styles or scripts
		const htmlDoc = (
			<html lang={ document.documentElement.lang }>
				<head>
					<title>{ this.props.title }</title>
					<style dangerouslySetInnerHTML={ { __html: style } } />
				</head>
				<body data-resizable-iframe-connected="data-resizable-iframe-connected" className={ this.props.type }>
					<div dangerouslySetInnerHTML={ { __html: this.props.html } } />
					<script type="text/javascript" dangerouslySetInnerHTML={ { __html: observeAndResizeJS } } />
				</body>
			</html>
		);

		// writing the document like this makes it act in the same way as if it was
		// loaded over the network, so DOM creation and mutation, script execution, etc.
		// all work as expected
		this.iframe.contentWindow.document.open();
		this.iframe.contentWindow.document.write( '<!DOCTYPE html>' + renderToString( htmlDoc ) );
		this.iframe.contentWindow.document.close();
	}

	static get defaultProps() {
		return {
			html: '',
			title: '',
		};
	}

	render() {
		return (
			<iframe
				ref={ ( node ) => this.iframe = node }
				title={ this.props.title }
				scrolling="no"
				sandbox="allow-scripts allow-same-origin allow-presentation"
				onLoad={ this.trySandbox }
				width={ Math.ceil( this.state.width ) }
				height={ Math.ceil( this.state.height ) } />
		);
	}
}
