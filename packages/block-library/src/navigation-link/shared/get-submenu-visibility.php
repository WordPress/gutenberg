<?php
/**
 * Shared helper function for determining submenu visibility.
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
 * Backward compatibility: WordPress applies default attribute values, so submenuVisibility
 * will always have a value even for legacy blocks. We check the legacy openSubmenusOnClick
 * attribute first to preserve original behavior for blocks saved before the migration.
 *
 * @since 6.9.0
 *
 * @param array $attributes_or_context Block attributes or context containing submenuVisibility and/or openSubmenusOnClick/deprecatedOpenSubmenusOnClick.
 * @return string The visibility mode: 'hover', 'click', or 'always'.
 */
function block_core_shared_navigation_get_submenu_visibility( $attributes_or_context ) {
	// Check for both possible keys for the deprecated attribute.
	// Navigation block uses 'openSubmenusOnClick' directly in attributes.
	// Navigation submenu block receives 'deprecatedOpenSubmenusOnClick' from context.
	$open_submenus_on_click = $attributes_or_context['openSubmenusOnClick'] ?? $attributes_or_context['deprecatedOpenSubmenusOnClick'] ?? null;

	// For backward compatibility, prioritize the legacy attribute if present.
	// Legacy blocks have openSubmenusOnClick in the database. Since WordPress applies
	// default values, submenuVisibility will also have a value, but we check the legacy
	// attribute first to preserve the original behavior. If the block has been loaded
	// and saved in the editor, then the deprecated attribute will not be present.
	if ( null !== $open_submenus_on_click ) {
		// Convert boolean to string: true -> 'click', false -> 'hover'.
		return ! empty( $open_submenus_on_click ) ? 'click' : 'hover';
	}

	$submenu_visibility = $attributes_or_context['submenuVisibility'] ?? null;

	// Use submenuVisibility for migrated/new blocks (where deprecated attribute is null).
	return $submenu_visibility ?? 'hover';
}
