/**
 * WordPress dependencies
 */
import { Component, createRef } from '@wordpress/element';
import { withGlobalEvents } from '@wordpress/compose';

/**
 * Browser dependencies
 */

const { FocusEvent } = window;

class WpEmbedPreview extends Component {
	constructor() {
		super( ...arguments );

		this.checkFocus = this.checkFocus.bind( this );
		this.node = createRef();
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
		return (
			<div
				ref={ this.node }
				className="wp-block-embed__wrapper"
				dangerouslySetInnerHTML={ { __html: html } }
			/>
		);
	}
}

export default withGlobalEvents( {
	blur: 'checkFocus',
} )( WpEmbedPreview );
