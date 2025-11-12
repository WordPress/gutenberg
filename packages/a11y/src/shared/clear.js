/**
 * Clears the a11y-speak-region elements and hides the explanatory text.
 */
export default function clear() {
	const regions = document.getElementsByClassName( 'a11y-speak-region' );
	const introText = document.getElementById( 'a11y-speak-intro-text' );

	for ( let i = 0; i < regions.length; i++ ) {
		regions[ i ].textContent = '';
	}

	// Make sure the explanatory text is hidden from assistive technologies.
	if ( introText ) {
		introText.setAttribute( 'hidden', 'hidden' );
	}
}
