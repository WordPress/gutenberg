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
 * `shouldShowStyleBook()` in
 * `packages/edit-site/src/components/sidebar-global-styles/utils.js`.
 *
 * @param section    The Styles section.
 * @param preference The saved preference, if any.
 * @return Whether to show the Style Book.
 */
export function shouldShowStyleBook(
	section: string,
	preference: boolean | undefined
): boolean {
	return (
		preference !== false &&
		! section.startsWith( '/revisions' ) &&
		! section.startsWith( '/css' )
	);
}
