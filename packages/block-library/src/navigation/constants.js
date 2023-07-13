export const DEFAULT_BLOCK = {
	name: 'core/navigation-link',
};

export const ALLOWED_BLOCKS = [
	'core/navigation-link',
	'core/search',
	'core/social-links',
	'core/page-list',
	'core/spacer',
	'core/home-link',
	'core/site-title',
	'core/site-logo',
	'core/navigation-submenu',
	'core/loginout',
];

export const PRIORITIZED_INSERTER_BLOCKS = [
	'core/navigation-link/page',
	'core/navigation-link',
];

export const SELECT_NAVIGATION_MENUS_ARGS = [
	'postType',
	'wp_navigation',
	{
		per_page: 100,
		status: [ 'publish', 'draft' ],
		order: 'desc',
		orderby: 'date',
	},
];
