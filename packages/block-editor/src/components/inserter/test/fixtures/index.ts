export const categories = [
	{ slug: 'text', title: 'Text' },
	{ slug: 'media', title: 'Media' },
	{ slug: 'design', title: 'Design' },
	{ slug: 'widgets', title: 'Widgets' },
	{ slug: 'theme', title: 'Theme' },
	{ slug: 'embed', title: 'Embeds' },
	{ slug: 'reusable', title: 'Reusable blocks' },
];

export const collections = {
	core: {
		icon: undefined,
		title: 'Core',
	},
};

export const paragraphItem = {
	id: 'core/paragraph-block',
	name: 'core/paragraph-block',
	initialAttributes: {},
	title: 'Paragraph',
	category: 'text',
	isDisabled: false,
	utility: 1,
	keywords: [ 'random' ],
};

export const withSingleVariationItem = {
	id: 'core/embed',
	name: 'core/embed',
	description: 'core description',
	initialAttributes: {},
	category: 'embed',
	variations: [
		{
			name: 'youtube',
			title: 'YouTube',
			description: 'youtube description',
		},
	],
};

export const withDefaultVariationItem = {
	id: 'core/block-with-default-variation',
	name: 'core/block-with-default-variation',
	description: 'core description',
	initialAttributes: {},
	category: 'text',
	variations: [
		{
			name: 'special',
			title: 'Special',
			isDefault: true,
		},
	],
};

export const withVariationsItem = {
	id: 'core/block-with-variations',
	name: 'core/block-with-variations',
	initialAttributes: {},
	title: 'With Variations',
	category: 'widgets',
	isDisabled: false,
	utility: 1,
	variations: [
		{
			name: 'variation-one',
			title: 'Variation One',
		},
		{
			name: 'variation-two',
			title: 'Variation Two',
		},
		{
			name: 'variation-three',
			title: 'Variation Three',
			keywords: [ 'music', 'random' ],
		},
	],
};

export const advancedParagraphItem = {
	id: 'core/advanced-paragraph-block',
	name: 'core/advanced-paragraph-block',
	initialAttributes: {},
	title: 'Advanced Paragraph',
	category: 'text',
	isDisabled: false,
	utility: 1,
};

export const someOtherItem = {
	id: 'core/some-other-block',
	name: 'core/some-other-block',
	initialAttributes: {},
	title: 'Some Other Block',
	category: 'text',
	isDisabled: false,
	utility: 1,
};

export const moreItem = {
	id: 'core/more-block',
	name: 'core/more-block',
	initialAttributes: {},
	title: 'More',
	category: 'design',
	isDisabled: true,
	utility: 1,
};

export const youtubeItem = {
	id: 'core/embed',
	name: 'core/embed',
	initialAttributes: {},
	title: 'YouTube',
	category: 'embed',
	keywords: [ 'google', 'video' ],
	isDisabled: false,
	utility: 1,
};

export const paragraphEmbedItem = {
	id: 'core-embed/a-paragraph-embed',
	name: 'core-embed/a-paragraph-embed',
	initialAttributes: {},
	title: 'A Paragraph Embed',
	category: 'embed',
	isDisabled: false,
	utility: 1,
};

export const reusableItem = {
	id: 'core/block/123',
	name: 'core/block',
	initialAttributes: { ref: 123 },
	title: 'My reusable block',
	category: 'reusable',
	isDisabled: false,
	utility: 1,
};

export default [
	withVariationsItem,
	paragraphItem,
	advancedParagraphItem,
	someOtherItem,
	moreItem,
	youtubeItem,
	paragraphEmbedItem,
	reusableItem,
];
