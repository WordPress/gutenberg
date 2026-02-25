/**
 * WordPress dependencies
 */
import useMenuUsedInTemplateParts from '../../hooks/use-menu-used-in-template-parts';

export default function useNavigationMenuUsedIn( menuId ) {
	return useMenuUsedInTemplateParts( menuId );
}
