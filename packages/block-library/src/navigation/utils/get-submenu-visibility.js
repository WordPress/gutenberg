/**
 * Returns the submenu visibility value with backward compatibility
 * for the deprecated openSubmenusOnClick attribute.
 *
 * This function centralizes the migration logic from the boolean
 * openSubmenusOnClick to the new submenuVisibility enum.
 *
 * NOTE: Keep this function in sync with block_core_navigation_get_submenu_visibility
 * in packages/block-library/src/navigation/index.php
 *
 * @param {Object} attributes Block attributes containing submenuVisibility and/or openSubmenusOnClick.
 * @return {string} The visibility mode: 'hover', 'click', or 'always'.
 */
export function getSubmenuVisibility( attributes ) {
	const { submenuVisibility, openSubmenusOnClick } = attributes;

	// If new attribute is set, use it
	if ( submenuVisibility ) {
		return submenuVisibility;
	}

	// Fall back to old attribute for backward compatibility
	// openSubmenusOnClick: true  -> 'click'
	// openSubmenusOnClick: false -> 'hover'
	// openSubmenusOnClick: undefined -> 'hover' (default)
	return openSubmenusOnClick ? 'click' : 'hover';
}
