declare global {
	interface Window {
		/** Whether the admin menu is shown as a rail next to the page. */
		__experimentalAdminNavigationRail?: boolean;
	}
}

/**
 * Whether the admin navigation rail experiment shows the admin menu next to
 * the page, in which case the sidebar navigation stands in for the submenu of
 * the current admin section.
 *
 * @return Whether the admin navigation rail is shown.
 */
export function isAdminNavigationRailEnabled() {
	return !! window.__experimentalAdminNavigationRail;
}
