/**
 * Imported from Calypso, with some lint fixes and gutenburg specific changes.
 */

/**
 * External dependencies
 */
import { omit } from 'lodash';

export default class ResizableIframe extends wp.element.Component {

	constructor() {
		super( ...arguments );
		this.state = {
			width: 0,
			height: 0,
		};
		this.getFrameBody = this.getFrameBody.bind( this );
		this.maybeConnect = this.maybeConnect.bind( this );
		this.isFrameAccessible = this.isFrameAccessible.bind( this );
		this.checkMessageForResize = this.checkMessageForResize.bind( this );
	}

	static get defaultProps() {
		return {
			onLoad: () => {},
			onResize: () => {},
			title: '',
		};
	}

	componentDidMount() {
		window.addEventListener( 'message', this.checkMessageForResize, false );
		this.maybeConnect();
	}

	componentDidUpdate() {
		this.maybeConnect();
	}

	componentWillUnmount() {
		window.removeEventListener( 'message', this.checkMessageForResize );
	}

	getFrameBody() {
		return this.iframe.contentDocument.body;
	}

	maybeConnect() {
		if ( ! this.isFrameAccessible() ) {
			return;
		}

		const body = this.getFrameBody();
		if ( null !== body.getAttribute( 'data-resizable-iframe-connected' ) ) {
			return;
		}

		const script = document.createElement( 'script' );
		script.innerHTML = `
			( function() {
				var observer;

				if ( ! window.MutationObserver || ! document.body || ! window.top ) {
					return;
				}

				function sendResize() {
					window.top.postMessage( {
						action: 'resize',
						width: document.body.offsetWidth,
						height: document.body.offsetHeight
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
				document.body.setAttribute( 'data-resizable-iframe-connected', '' );

				// Make sure that we don't miss very quick loading documents here that the observer
				// doesn't see load, but haven't completely loaded when we call sendResize for the
				// first time.
				setTimeout( sendResize, 1000 );
			} )();
		`;
		body.appendChild( script );
	}

	isFrameAccessible() {
		try {
			return !! this.getFrameBody();
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
			this.props.onResize();
		}
	}

	onLoad( event ) {
		this.maybeConnect();
		this.props.onLoad( event );
	}

	render() {
		const omitProps = [ 'onResize' ];

		if ( ! this.props.src ) {
			omitProps.push( 'src' );
		}
		return (
			<iframe
				ref={ ( node ) => this.iframe = node }
				title={ this.props.title }
				scrolling="no"
				{ ...omit( this.props, omitProps ) }
				onLoad={ this.onLoad }
				width={ this.props.width || this.state.width }
				height={ this.props.height || this.state.height } />
		);
	}
}
