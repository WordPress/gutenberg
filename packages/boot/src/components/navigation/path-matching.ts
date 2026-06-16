/**
 * Internal dependencies
 */
import type { MenuItem } from '../../store/types';

const normalizePath = ( path: string ) => {
	const normalized = path.startsWith( '/' ) ? path : '/' + path;
	return normalized.endsWith( '/' ) && normalized.length > 1
		? normalized.slice( 0, -1 )
		: normalized;
};

const getMenuItemDepth = ( item: MenuItem, menuItems: MenuItem[] ): number => {
	let depth = 0;
	let currentItem = item;
	const visitedIds = new Set( [ item.id ] );

	while ( currentItem.parent ) {
		const parentItem = menuItems.find(
			( candidate ) => candidate.id === currentItem.parent
		);

		if ( ! parentItem || visitedIds.has( parentItem.id ) ) {
			break;
		}

		visitedIds.add( parentItem.id );
		currentItem = parentItem;
		depth++;
	}

	return depth;
};

/**
 * Checks if a menu path is a valid parent path of the current path.
 * A valid parent path must be a complete path prefix, not just share segments.
 *
 * @param currentPath - Current page path
 * @param menuPath    - Menu item path to check as potential parent
 * @return True if menuPath is a parent of currentPath
 */
const isValidParentPath = (
	currentPath: string,
	menuPath: string
): boolean => {
	if ( ! menuPath || menuPath === currentPath ) {
		return false;
	}

	const normalizedCurrent = normalizePath( currentPath );
	const normalizedMenu = normalizePath( menuPath );

	// Menu path must be shorter and current path must start with menu path + '/'
	return (
		normalizedCurrent.startsWith( normalizedMenu ) &&
		( normalizedCurrent[ normalizedMenu.length ] === '/' ||
			normalizedMenu === '/' )
	);
};

/**
 * Finds the menu item that is the closest parent of the current path.
 * Only considers menu items that have a 'to' path defined and are valid parents.
 *
 * @param currentPath - Current page path
 * @param menuItems   - Array of all menu items
 * @return Menu item that is the closest parent, or null if no valid parent found
 */
export const findClosestMenuItem = (
	currentPath: string,
	menuItems: MenuItem[]
): MenuItem | null => {
	const normalizedCurrentPath = normalizePath( currentPath );
	const exactMatches = menuItems.filter(
		( item ) => normalizePath( item.to ) === normalizedCurrentPath
	);
	if ( exactMatches.length > 0 ) {
		return exactMatches.reduce( ( bestMatch, item ) =>
			getMenuItemDepth( item, menuItems ) >
			getMenuItemDepth( bestMatch, menuItems )
				? item
				: bestMatch
		);
	}

	let bestMatch: MenuItem | null = null;
	let bestPathLength = 0;

	for ( const item of menuItems ) {
		if ( ! item.to ) {
			continue;
		}

		// Only consider items that are valid parents of the current path
		if ( isValidParentPath( currentPath, item.to ) ) {
			// Prefer the longest parent path (most specific)
			if ( item.to.length > bestPathLength ) {
				bestMatch = item;
				bestPathLength = item.to.length;
			}
		}
	}

	return bestMatch;
};

/**
 * Finds the drilldown parent of a menu item by traversing up the menu tree.
 *
 * @param id        - The ID of the menu item to find the drilldown parent for
 * @param menuItems - Array of all menu items
 * @return The ID of the drilldown parent, or undefined if none found
 */
export const findDrilldownParent = (
	id: string | undefined,
	menuItems: MenuItem[]
): string | undefined => {
	if ( ! id ) {
		return undefined;
	}

	const currentItem = menuItems.find( ( item ) => item.id === id );
	if ( ! currentItem ) {
		return undefined;
	}

	// If the item has a parent, check if that parent is a drilldown
	if ( currentItem.parent ) {
		const parentItem = menuItems.find(
			( item ) => item.id === currentItem.parent
		);

		if ( parentItem?.parent_type === 'drilldown' ) {
			return parentItem.id;
		}

		if ( parentItem ) {
			return findDrilldownParent( parentItem.id, menuItems );
		}
	}

	return undefined;
};

/**
 * Finds the dropdown parent of a menu item.
 *
 * @param id        - The ID of the menu item to find the dropdown parent for
 * @param menuItems - Array of all menu items
 * @return The ID of the dropdown parent, or undefined if none found
 */
export const findDropdownParent = (
	id: string | undefined,
	menuItems: MenuItem[]
): string | undefined => {
	if ( ! id ) {
		return undefined;
	}

	const currentItem = menuItems.find( ( item ) => item.id === id );
	if ( ! currentItem ) {
		return undefined;
	}

	// If the item has a parent, check if that parent is a dropdown
	if ( currentItem.parent ) {
		const parentItem = menuItems.find(
			( item ) => item.id === currentItem.parent
		);

		if ( parentItem?.parent_type === 'dropdown' ) {
			return parentItem.id;
		}
	}

	return undefined;
};
