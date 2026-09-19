const NAVIGATION_POST_TYPE = 'wp_navigation';

export function getNavigationMenuCanvas( navigationId: number ) {
	return {
		postType: NAVIGATION_POST_TYPE,
		postId: String( navigationId ),
		isPreview: true,
		customCanvas: true,
	};
}
