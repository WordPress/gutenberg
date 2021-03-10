export const plugin = {
	name: 'boxer/boxer',
	title: 'Boxer',
	description:
		'Boxer is a Block that puts your WordPress posts into boxes on a page.',
	id: 'boxer-block',
	icon: 'block-default',
	rating: 5,
	ratingCount: 1,
	activeInstalls: 0,
	authorBlockRating: 5,
	authorBlockCount: '1',
	author: 'CK Lee',
	assets: [
		'http://plugins.svn.wordpress.org/boxer-block/trunk/build/index.js',
		'http://plugins.svn.wordpress.org/boxer-block/trunk/build/view.js',
	],
	humanizedUpdated: '3 months ago',
};

export const items = [
	plugin,
	{ ...plugin, name: 'my-block/test', id: 'my-block' },
];
