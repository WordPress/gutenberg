import { NAVIGATION_OVERLAY_TEMPLATE_PART_AREA } from './navigation/constants';
import { NavigationLinkUI } from './navigation/edit/navigation-link-ui';
import NavigationMenuListView from './navigation/menu-list-view';
import CreateSubmenuMenuGroup from './navigation/menu-list-view/create-submenu';
import MenuLocations, {
	MenuWhereUsed,
	useNavigationLocations,
} from './navigation/menu-locations';
import { lock } from './lock-unlock';

/**
 * @private
 */
export const privateApis = {};
lock( privateApis, {
	NAVIGATION_OVERLAY_TEMPLATE_PART_AREA,
	NavigationLinkUI,
	NavigationMenuListView,
	CreateSubmenuMenuGroup,
	MenuLocations,
	MenuWhereUsed,
	useNavigationLocations,
} );
