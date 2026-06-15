// cspell:ignore adminmenuback
const ADMIN_MENU_ID = 'adminmenuback';

/**
 * Width, in pixels, taken up by the WordPress admin menu
 * (`#adminmenuback`) on the inline-start edge of the viewport.
 *
 * The settings drawer portals to the document body and anchors to a
 * viewport edge, so a left-anchored drawer would slide over the fixed
 * admin menu. Offsetting the drawer by this value keeps the menu
 * uncovered (and reachable) instead of raising the drawer's z-index over
 * it.
 *
 * Defensive: returns `0` when the element is absent (outside wp-admin, or
 * in tests/Storybook), so the drawer just anchors to the viewport edge.
 *
 * @return {number} The admin menu's right edge in px, or `0`.
 */
export function getAdminMenuInset(): number {
	if ( typeof document === 'undefined' ) {
		return 0;
	}

	const adminMenu = document.getElementById( ADMIN_MENU_ID );
	if ( ! adminMenu ) {
		return 0;
	}

	return Math.max( 0, adminMenu.getBoundingClientRect().right );
}
