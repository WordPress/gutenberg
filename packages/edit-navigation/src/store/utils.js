export const KIND = 'root';
export const POST_TYPE = 'postType';
export const buildNavigationPostId = ( menuId ) =>
	`navigation-post-${ menuId }`;

export function uuidv4() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace( /[xy]/g, ( c ) => {
		// eslint-disable-next-line no-restricted-syntax
		const a = Math.random() * 16;
		// eslint-disable-next-line no-bitwise
		const r = a | 0;
		// eslint-disable-next-line no-bitwise
		const v = c === 'x' ? r : ( r & 0x3 ) | 0x8;
		return v.toString( 16 );
	} );
}

export function menuItemsQuery( menuId ) {
	return { menus: menuId, per_page: -1 };
}
