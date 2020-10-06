export const TEMPLATES_DEFAULT_DETAILS = {
	// General
	'front-page': {
		title: 'Front page',
		description: '',
	},
	archive: {
		title: 'Archive',
		description:
			'Displays the content lists when no other template is found',
	},
	single: {
		title: 'Single',
		description: 'Displays the content of a single post',
	},
	singular: {
		title: 'Singular',
		description: 'Displays the content of a single page',
	},
	index: {
		title: 'Default (index)',
		description: 'Displays the content of a single page',
	},
	search: {
		title: 'Search results',
		description: '',
	},
	'404': {
		title: '404',
		description: 'Displayed when a non-existing page requested',
	},

	// Pages
	page: {
		title: 'Default (Page)',
		description: 'Displays the content of a single page',
	},

	// Posts
	home: {
		title: 'Posts (home)',
		description: 'Displayed on your homepage',
	},
	'archive-post': {
		title: 'Default (Post archive)',
		description: 'Displays a list of posts',
	},
	'single-post': {
		title: 'Default (Single post)',
		description: 'Displays the content of a single post',
	},
};

export const TEMPLATES_GENERAL = [
	'front-page',
	'archive',
	'single',
	'singular',
	'index',
	'search',
	'404',
];

export const TEMPLATES_POSTS = [ 'single-post', 'archive-post', 'home' ];
