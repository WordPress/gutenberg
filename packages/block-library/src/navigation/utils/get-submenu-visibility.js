/**
 * Returns the submenu visibility value with backward compatibility
 * for the deprecated openSubmenusOnClick attribute.
 *
 * This function centralizes the migration logic from the boolean
 * openSubmenusOnClick to the new submenuVisibility enum.
 *
 * This function handles two use cases:
 * 1. Navigation block editing its own attributes - receives attributes object
 * 2. Submenu block receiving context - receives context object with deprecatedOpenSubmenusOnClick
 *
 * Backward compatibility handling:
 * - Legacy blocks (saved before migration):
 *   Have openSubmenusOnClick in database. Parent Navigation block passes it via context
 *   as deprecatedOpenSubmenusOnClick. We prioritize it to preserve the original behavior.
 *
 * - Migrated blocks (opened in editor after migration):
 *   JavaScript deprecation removes openSubmenusOnClick and sets submenuVisibility.
 *   We use submenuVisibility since deprecatedOpenSubmenusOnClick is null.
 *
 * - New blocks (created after migration):
 *   Only have submenuVisibility, deprecatedOpenSubmenusOnClick is null.
 *   We use submenuVisibility.
 *
 * NOTE: Keep this function in sync with block_core_navigation_submenu_get_submenu_visibility
 * in packages/block-library/src/navigation-submenu/index.php
 *
 * @param {Object} attributesOrContext Block attributes or context from parent Navigation block.
 * @return {string} The visibility mode: 'hover', 'click', or 'always'.
 */
export function getSubmenuVisibility( attributesOrContext ) {
	const {
		submenuVisibility,
		openSubmenusOnClick,
		deprecatedOpenSubmenusOnClick,
	} = attributesOrContext;

	// For backward compatibility with context passed to submenu blocks,
	// prioritize deprecatedOpenSubmenusOnClick if present.
	if (
		deprecatedOpenSubmenusOnClick !== null &&
		deprecatedOpenSubmenusOnClick !== undefined
	) {
		// Convert boolean to string: true -> 'click', false -> 'hover'.
		return deprecatedOpenSubmenusOnClick ? 'click' : 'hover';
	}

	// For backward compatibility with Navigation block's own attributes
	// (before migration runs), check openSubmenusOnClick.
	if ( openSubmenusOnClick !== null && openSubmenusOnClick !== undefined ) {
		return openSubmenusOnClick ? 'click' : 'hover';
	}

	// Use submenuVisibility for migrated/new blocks.
	return submenuVisibility ?? 'hover';
}
