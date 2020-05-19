const pluginBase = {
	name: 'boxer/boxer',
	title: 'Boxer',
	description:
		'Boxer is a Block that puts your WordPress posts into boxes on a page.',
	id: 'boxer-block',
	rating: 5,
	rating_count: 1,
	active_installs: 0,
	author_block_rating: 5,
	author_block_count: '1',
	author: 'CK Lee',
	assets: [
		'http://plugins.svn.wordpress.org/boxer-block/trunk/build/index.js',
		'http://plugins.svn.wordpress.org/boxer-block/trunk/build/view.js',
	],
	humanized_updated: '3 months ago',
};

export const pluginWithIcon = { ...pluginBase, icon: 'block-default' };
export const pluginWithImg = {
	...pluginBase,
	icon: 'https://ps.w.org/listicles/assets/icon-128x128.png',
};
