export const categories = [
	{ slug: 'common', title: 'Common blocks' },
	{ slug: 'formatting', title: 'Formatting' },
	{ slug: 'layout', title: 'Layout elements' },
	{ slug: 'widgets', title: 'Widgets' },
	{ slug: 'embed', title: 'Embeds' },
	{ slug: 'reusable', title: 'Reusable blocks' },
];

export const collections = {
	core: {
		icon: undefined,
		title: 'Core',
	},
};

export const textItem = {
	id: 'core/text-block',
	name: 'core/text-block',
	initialAttributes: {},
	title: 'Text',
	category: 'common',
	isDisabled: false,
	utility: 1,
};

export const advancedTextItem = {
	id: 'core/advanced-text-block',
	name: 'core/advanced-text-block',
	initialAttributes: {},
	title: 'Advanced Text',
	category: 'common',
	isDisabled: false,
	utility: 1,
};

export const someOtherItem = {
	id: 'core/some-other-block',
	name: 'core/some-other-block',
	initialAttributes: {},
	title: 'Some Other Block',
	category: 'common',
	isDisabled: false,
	utility: 1,
};

export const moreItem = {
	id: 'core/more-block',
	name: 'core/more-block',
	initialAttributes: {},
	title: 'More',
	category: 'layout',
	isDisabled: true,
	utility: 0,
};

export const youtubeItem = {
	id: 'core-embed/youtube',
	name: 'core-embed/youtube',
	initialAttributes: {},
	title: 'YouTube',
	category: 'embed',
	keywords: [ 'google', 'video' ],
	isDisabled: false,
	utility: 0,
};

export const textEmbedItem = {
	id: 'core-embed/a-text-embed',
	name: 'core-embed/a-text-embed',
	initialAttributes: {},
	title: 'A Text Embed',
	category: 'embed',
	isDisabled: false,
	utility: 0,
};

export const reusableItem = {
	id: 'core/block/123',
	name: 'core/block',
	initialAttributes: { ref: 123 },
	title: 'My reusable block',
	category: 'reusable',
	isDisabled: false,
	utility: 0,
};

export default [
	textItem,
	advancedTextItem,
	someOtherItem,
	moreItem,
	youtubeItem,
	textEmbedItem,
	reusableItem,
];
