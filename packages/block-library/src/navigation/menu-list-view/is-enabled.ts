/**
 * Whether the Navigation menu editing prototypes are enabled.
 *
 * Gated by the "Navigation menu editing prototypes" experiment on the
 * Gutenberg > Experiments screen (`gutenberg-navigation-menu-editing`).
 *
 * @return Whether the prototypes are enabled.
 */
export default function isNavigationMenuEditingEnabled(): boolean {
	return !! (
		globalThis as typeof globalThis & {
			__experimentalNavigationMenuEditing?: boolean;
		}
	 )?.__experimentalNavigationMenuEditing;
}
