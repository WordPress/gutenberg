/**
 * Clear the a11y-speak-region elements.
 */
export default function clear() {
	const regions = document.getElementsByClassName( 'a11y-speak-region' );

	for ( let i = 0; i < regions.length; i++ ) {
		regions[ i ].textContent = '';
	}
}
