export const KIND = 'root';
export const POST_TYPE = 'postType';
export const buildNavigationPostId = ( menuId ) =>
	`navigation-post-${ menuId }`;

export function menuItemsQuery( menuId ) {
	return { menus: menuId, per_page: -1 };
}
