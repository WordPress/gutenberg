import { NAVIGATION_OVERLAY_TEMPLATE_PART_AREA } from './navigation/constants';
import { NavigationLinkUI } from './navigation/edit/navigation-link-ui';
import { NavigationMenuItems } from './navigation/edit/menu-inspector-controls';
import { lock } from './lock-unlock';

/**
 * @private
 */
export const privateApis = {};
lock( privateApis, {
	NAVIGATION_OVERLAY_TEMPLATE_PART_AREA,
	NavigationLinkUI,
	NavigationMenuItems,
} );
