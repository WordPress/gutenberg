/**
 * WordPress dependencies
 */
import { Component, createRef } from '@wordpress/element';
import { withGlobalEvents } from '@wordpress/compose';

/** @typedef {import('@wordpress/element').WPSyntheticEvent} WPSyntheticEvent */

/**
 * Browser dependencies
 */

const { FocusEvent, DOMParser } = window;

class WpEmbedPreview extends Component {
	constructor() {
		super( ...arguments );

		this.checkFocus = this.checkFocus.bind( this );
		this.node = createRef();
	}

	componentDidMount() {
		window.addEventListener( 'message', this.resizeWPembeds );
	}

	componentWillUnmount() {
		window.removeEventListener( 'message', this.resizeWPembeds );
	}

	/**
	 * Checks for WordPress embed events signaling the height change when iframe
	 * content loads or iframe's window is resized.  The event is sent from
	 * WordPress core via the window.postMessage API.
	 *
	 * References:
	 * window.postMessage: https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
	 * WordPress core embed-template on load: https://github.com/WordPress/WordPress/blob/master/wp-includes/js/wp-embed-template.js#L143
	 * WordPress core embed-template on resize: https://github.com/WordPress/WordPress/blob/master/wp-includes/js/wp-embed-template.js#L187
	 *
	 * @param {WPSyntheticEvent} event Message event.
	 */
	resizeWPembeds( { data: { secret, message, value } = {} } ) {
		if (
			[ secret, message, value ].some( ( attribute ) => ! attribute ) ||
			message !== 'height'
		) {
			return;
		}

		document
			.querySelectorAll( `iframe[data-secret="${ secret }"` )
			.forEach( ( iframe ) => {
				if ( +iframe.height !== value ) {
					iframe.height = value;
				}
			} );
	}

	/**
	 * Checks whether the wp embed iframe is the activeElement,
	 * if it is dispatch a focus event.
	 */
	checkFocus() {
		const { activeElement } = document;

		if (
			activeElement.tagName !== 'IFRAME' ||
			activeElement.parentNode !== this.node.current
		) {
			return;
		}

		const focusEvent = new FocusEvent( 'focus', { bubbles: true } );
		activeElement.dispatchEvent( focusEvent );
	}

	render() {
		const { html } = this.props;
		const doc = new DOMParser().parseFromString( html, 'text/html' );
		const iframe = doc.querySelector( 'iframe' );
		if ( iframe ) iframe.removeAttribute( 'style' );
		const blockQuote = doc.querySelector( 'blockquote' );
		if ( blockQuote ) blockQuote.style.display = 'none';

		return (
			<div
				ref={ this.node }
				className="wp-block-embed__wrapper"
				dangerouslySetInnerHTML={ { __html: doc.body.innerHTML } }
			/>
		);
	}
}

export default withGlobalEvents( {
	blur: 'checkFocus',
} )( WpEmbedPreview );
