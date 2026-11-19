import { useResourcePermissions } from '@wordpress/core-data';
import { NAVIGATION_POST_TYPE } from '../../utils/constants';

const NAVIGATION_MENUS_RESOURCE = {
	kind: 'postType',
	name: NAVIGATION_POST_TYPE,
};

/**
 * Checks whether the current user can manage Navigation Menus.
 *
 * Opening the Site Editor doesn't imply this: sites can deny the Navigation
 * Menu capabilities to a user who keeps `edit_theme_options`. The REST API
 * only reports the post type's `create_posts` capability for the collection,
 * so that capability gates the Navigation screens. The extensible site editor
 * gates its Navigation menu item on the same capability on the server.
 *
 * @return Whether the user can manage Navigation Menus, or `undefined` while
 *         the permission is resolving.
 */
export default function useCanManageNavigationMenus(): boolean | undefined {
	const { canCreate, hasResolved } = useResourcePermissions(
		NAVIGATION_MENUS_RESOURCE
	);

	return hasResolved ? !! canCreate : undefined;
}
