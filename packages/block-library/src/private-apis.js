import { NAVIGATION_OVERLAY_TEMPLATE_PART_AREA } from './navigation/constants';
import { NavigationLinkUI } from './navigation/edit/navigation-link-ui';
import AdvancedMenuControl from './navigation/edit/advanced-menu-control';
import { useIsPagesOnlyMenu } from './navigation/use-is-pages-only-menu';
import { lock } from './lock-unlock';

// Blocks whose List View rows have a toggle to show or hide them.
const NAVIGATION_VISIBILITY_TOGGLE_BLOCKS = [ 'core/page-list-item' ];

/**
 * @private
 */
export const privateApis = {};
lock( privateApis, {
	NAVIGATION_OVERLAY_TEMPLATE_PART_AREA,
	NavigationLinkUI,
	AdvancedMenuControl,
	useIsPagesOnlyMenu,
	NAVIGATION_VISIBILITY_TOGGLE_BLOCKS,
} );
