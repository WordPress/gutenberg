/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Build the explanatory text to be placed before the aria live regions.
 *
 * This text is initially hidden from assistive technologies by using a `hidden`
 * HTML attribute which is then removed once a message fills the aria-live regions.
 *
 * @return {HTMLParagraphElement} The explanatory text HTML element.
 */
export default function addIntroText() {
	const introText = document.createElement( 'p' );

	introText.id = 'a11y-speak-intro-text';
	introText.className = 'a11y-speak-intro-text';
	introText.textContent = __( 'Notifications' );

	introText.setAttribute(
		'style',
		'position: absolute;' +
			'margin: -1px;' +
			'padding: 0;' +
			'height: 1px;' +
			'width: 1px;' +
			'overflow: hidden;' +
			'clip: rect(1px, 1px, 1px, 1px);' +
			'-webkit-clip-path: inset(50%);' +
			'clip-path: inset(50%);' +
			'border: 0;' +
			'word-wrap: normal !important;'
	);
	introText.setAttribute( 'hidden', 'hidden' );

	const { body } = document;
	if ( body ) {
		body.appendChild( introText );
	}

	return introText;
}
