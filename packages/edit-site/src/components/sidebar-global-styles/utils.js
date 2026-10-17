/**
 * Whether navigating between two Styles sections should turn the Style Book on.
 *
 * The Style Book is turned on when entering a section from the root, as it is
 * a better preview of each section. Moving between sections keeps the current
 * state, so turning it off is respected. Revisions and custom CSS keep the
 * site preview. Mirrors `shouldOpenStyleBook()` in `routes/styles/utils.ts`.
 *
 * @param {string} currentSection The section being navigated from.
 * @param {string} nextSection    The section being navigated to.
 * @return {boolean} Whether to turn the Style Book on.
 */
export function shouldOpenStyleBook( currentSection, nextSection ) {
	return (
		currentSection === '/' &&
		nextSection !== '/' &&
		! nextSection.startsWith( '/revisions' ) &&
		! nextSection.startsWith( '/css' )
	);
}
