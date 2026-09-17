import { NAVIGATION_OVERLAY_TEMPLATE_PART_AREA } from './navigation/constants';
import { NavigationLinkUI } from './navigation/edit/navigation-link-ui';
import { Controls as NavigationLinkControls } from './navigation-link/shared';
import { convertToNavigationLinks } from './page-list/use-convert-to-navigation-links';
import { lock } from './lock-unlock';

/**
 * @private
 */
export const privateApis = {};
lock( privateApis, {
	NAVIGATION_OVERLAY_TEMPLATE_PART_AREA,
	NavigationLinkUI,
	NavigationLinkControls,
	convertToNavigationLinks,
} );
