/**
 * Internal dependencies
 */
import useNavigationMenu from '../use-navigation-menu';
import useNavigationEntities from '../use-navigation-entities';

const useHasClassicOrNavigationMenus = () => {
	const { menus: classicMenus } = useNavigationEntities();
	const { navigationMenus } = useNavigationMenu();
	const hasNavigationMenus = !! navigationMenus?.length;
	const hasClassicMenus = !! classicMenus?.length;
	return hasClassicMenus || hasNavigationMenus;
};

export default useHasClassicOrNavigationMenus;
