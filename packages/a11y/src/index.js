/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';

/**
 * Internal dependencies
 */
import addContainer from './script/add-container';
import addIntroText from './script/add-intro-text';

export { speak } from './shared/index';

/**
 * Create the live regions.
 */
export function setup() {
	const introText = document.getElementById( 'a11y-speak-intro-text' );
	const containerAssertive = document.getElementById(
		'a11y-speak-assertive'
	);
	const containerPolite = document.getElementById( 'a11y-speak-polite' );

	if ( introText === null ) {
		addIntroText();
	}

	if ( containerAssertive === null ) {
		addContainer( 'assertive' );
	}

	if ( containerPolite === null ) {
		addContainer( 'polite' );
	}
}

/**
 * Run setup on domReady.
 */
domReady( setup );
