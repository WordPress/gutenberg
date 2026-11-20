/**
 * Preference that remembers whether Styles shows the Style Book. The site
 * editor and the extensible site editor share it.
 */
export const STYLE_BOOK_PREFERENCE = 'showStyleBook';

/**
 * Whether a Styles section shows the Style Book when the URL doesn't say.
 *
 * Follows the user's preference, which is on until they turn the Style Book
 * off. Revisions and Additional CSS keep the site preview. Mirrors
 * `shouldShowStyleBook()` in `routes/styles/utils.ts`.
 *
 * @param {string}            section    The Styles section.
 * @param {boolean|undefined} preference The saved preference, if any.
 * @return {boolean} Whether to show the Style Book.
 */
export function shouldShowStyleBook( section, preference ) {
	return (
		preference !== false &&
		! section.startsWith( '/revisions' ) &&
		! section.startsWith( '/css' )
	);
}
