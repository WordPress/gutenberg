<?php
/**
 * Shared helper function for getting submenu visibility mode.
 *
 * @package WordPress
 */

/**
 * Returns the submenu visibility value with backward compatibility
 * for the deprecated openSubmenusOnClick attribute.
 *
 * This function centralizes the migration logic from the boolean
 * openSubmenusOnClick to the new submenuVisibility enum.
 *
 * Backward compatibility handling:
 * - Legacy blocks (saved before migration, never opened in editor):
 *   Have openSubmenusOnClick in database. Parent Navigation block passes it via context/attributes.
 *   We prioritize openSubmenusOnClick to preserve the original behavior.
 *
 * - Migrated blocks (opened in editor after migration):
 *   JavaScript deprecation removes openSubmenusOnClick and sets submenuVisibility.
 *   We use submenuVisibility since openSubmenusOnClick is null.
 *
 * - New blocks (created after migration):
 *   Only have submenuVisibility, openSubmenusOnClick is null.
 *   We use submenuVisibility.
 *
 * @since 6.9.0
 *
 * @param array $data Block context or attributes containing submenuVisibility and/or openSubmenusOnClick.
 * @return string The visibility mode: 'hover', 'click', or 'always'.
 */
function block_core_shared_get_submenu_visibility( $data ) {
	$deprecated_open_submenus_on_click = $data['openSubmenusOnClick'] ?? null;

	// For backward compatibility, prioritize the legacy attribute if present.
	// If the block has been updated and saved in the editor, then the deprecated
	// attribute will be replaced by submenuVisibility.
	if ( null !== $deprecated_open_submenus_on_click ) {
		// Convert boolean to string: true -> 'click', false -> 'hover'.
		return ! empty( $deprecated_open_submenus_on_click ) ? 'click' : 'hover';
	}

	$submenu_visibility = $data['submenuVisibility'] ?? null;

	// Use submenuVisibility for migrated/new blocks.
	return $submenu_visibility ?? 'hover';
}
