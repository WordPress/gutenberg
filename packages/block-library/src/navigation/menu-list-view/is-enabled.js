/**
 * Whether the Navigation menu editing prototypes are enabled.
 *
 * Gated by the "Navigation menu editing prototypes" experiment on the
 * Gutenberg > Experiments screen (`gutenberg-navigation-menu-editing`).
 *
 * @return {boolean} Whether the prototypes are enabled.
 */
export default function isNavigationMenuEditingEnabled() {
	return !! globalThis?.__experimentalNavigationMenuEditing;
}
