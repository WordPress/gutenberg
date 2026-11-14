export interface FixtureItem {
	id: string;
	value: string;
}

export interface FixtureGroup {
	label: string;
	items: FixtureItem[];
}

export const COMMANDS: FixtureItem[] = [
	{ id: 'c1', value: 'Add new page' },
	{ id: 'c2', value: 'Add new post' },
	{ id: 'c3', value: 'Edit site' },
	{ id: 'c4', value: 'View site' },
	{ id: 'c5', value: 'Manage plugins' },
	{ id: 'c6', value: 'Manage users' },
	{ id: 'c7', value: 'Open settings' },
	{ id: 'c8', value: 'Toggle dark mode' },
];

export const GROUPED_COMMANDS: FixtureGroup[] = [
	{
		label: 'Content',
		items: [
			{ id: 'g1', value: 'Add new page' },
			{ id: 'g2', value: 'Add new post' },
			{ id: 'g3', value: 'Edit site' },
		],
	},
	{
		label: 'Management',
		items: [
			{ id: 'g4', value: 'Manage plugins' },
			{ id: 'g5', value: 'Manage users' },
			{ id: 'g6', value: 'Open settings' },
		],
	},
	{
		label: 'Appearance',
		items: [
			{ id: 'g7', value: 'Toggle dark mode' },
			{ id: 'g8', value: 'View site' },
		],
	},
];

export const USERS: FixtureItem[] = [
	{ id: 'm1', value: 'alice' },
	{ id: 'm2', value: 'bob' },
	{ id: 'm3', value: 'carol' },
	{ id: 'm4', value: 'dave' },
	{ id: 'm5', value: 'eve' },
	{ id: 'm6', value: 'frank' },
	{ id: 'm7', value: 'grace' },
];

export const URLS: FixtureItem[] = [
	{ id: 'u1', value: 'wordpress.org' },
	{ id: 'u2', value: 'developer.wordpress.org/plugins/' },
	{ id: 'u3', value: 'developer.wordpress.org/themes/' },
	{ id: 'u4', value: 'developer.wordpress.org/block-editor/' },
	{ id: 'u5', value: 'github.com/WordPress/gutenberg' },
	{ id: 'u6', value: 'make.wordpress.org/core/' },
	{ id: 'u7', value: 'make.wordpress.org/design/' },
];

export const EMOJI_GROUPS = [
	{
		value: 'people',
		label: 'Smileys & people',
		items: [
			{ value: 'grinning', emoji: '😀', label: 'grinning face' },
			{ value: 'laugh', emoji: '😂', label: 'face with tears of joy' },
			{ value: 'wink', emoji: '😉', label: 'winking face' },
			{
				value: 'heart-eyes',
				emoji: '😍',
				label: 'smiling face with heart eyes',
			},
			{ value: 'thinking', emoji: '🤔', label: 'thinking face' },
			{
				value: 'cool',
				emoji: '😎',
				label: 'smiling face with sunglasses',
			},
			{ value: 'party', emoji: '🥳', label: 'partying face' },
			{ value: 'sleepy', emoji: '😴', label: 'sleeping face' },
			{ value: 'thumbs-up', emoji: '👍', label: 'thumbs up' },
			{ value: 'clap', emoji: '👏', label: 'clapping hands' },
			{ value: 'wave', emoji: '👋', label: 'waving hand' },
			{ value: 'raised-hands', emoji: '🙌', label: 'raising hands' },
			{ value: 'pray', emoji: '🙏', label: 'folded hands' },
			{ value: 'muscle', emoji: '💪', label: 'flexed biceps' },
			{ value: 'ok-hand', emoji: '👌', label: 'OK hand' },
			{ value: 'eyes', emoji: '👀', label: 'eyes' },
		],
	},
	{
		value: 'nature',
		label: 'Animals & nature',
		items: [
			{ value: 'dog', emoji: '🐶', label: 'dog face' },
			{ value: 'cat', emoji: '🐱', label: 'cat face' },
			{ value: 'fox', emoji: '🦊', label: 'fox' },
			{ value: 'bear', emoji: '🐻', label: 'bear' },
			{ value: 'sun', emoji: '☀️', label: 'sun' },
			{ value: 'rainbow', emoji: '🌈', label: 'rainbow' },
			{ value: 'tree', emoji: '🌳', label: 'deciduous tree' },
			{ value: 'blossom', emoji: '🌸', label: 'cherry blossom' },
		],
	},
	{
		value: 'food',
		label: 'Food & drink',
		items: [
			{ value: 'coffee', emoji: '☕', label: 'hot beverage' },
			{ value: 'pizza', emoji: '🍕', label: 'pizza' },
			{ value: 'burger', emoji: '🍔', label: 'hamburger' },
			{ value: 'taco', emoji: '🌮', label: 'taco' },
			{ value: 'cake', emoji: '🍰', label: 'shortcake' },
			{ value: 'apple', emoji: '🍎', label: 'red apple' },
			{ value: 'avocado', emoji: '🥑', label: 'avocado' },
			{ value: 'tea', emoji: '🍵', label: 'teacup without handle' },
		],
	},
	{
		value: 'objects',
		label: 'Objects & symbols',
		items: [
			{ value: 'rocket', emoji: '🚀', label: 'rocket' },
			{ value: 'bulb', emoji: '💡', label: 'light bulb' },
			{ value: 'gift', emoji: '🎁', label: 'wrapped gift' },
			{ value: 'books', emoji: '📚', label: 'books' },
			{ value: 'heart', emoji: '❤️', label: 'red heart' },
			{ value: 'sparkles', emoji: '✨', label: 'sparkles' },
			{ value: 'fire', emoji: '🔥', label: 'fire' },
			{ value: 'star', emoji: '⭐', label: 'star' },
		],
	},
];

export interface FixtureTreeItem extends FixtureItem {
	count: number;
	children?: FixtureTreeItem[];
}

export const CATEGORY_TREE: FixtureTreeItem[] = [
	{
		id: 'clothing',
		value: 'Clothing',
		count: 26,
		children: [
			{
				id: 'clothing-women',
				value: 'Women',
				count: 9,
				children: [
					{
						id: 'clothing-women-tops',
						value: 'Tops',
						count: 4,
						children: [
							{
								id: 'clothing-women-tops-shirts',
								value: 'Shirts',
								count: 2,
							},
							{
								id: 'clothing-women-tops-sweaters',
								value: 'Sweaters',
								count: 2,
							},
						],
					},
					{
						id: 'clothing-women-dresses',
						value: 'Dresses',
						count: 3,
					},
					{
						id: 'clothing-women-accessories',
						value: 'Accessories',
						count: 2,
					},
				],
			},
			{
				id: 'clothing-men',
				value: 'Men',
				count: 8,
				children: [
					{ id: 'clothing-men-shirts', value: 'Shirts', count: 3 },
					{ id: 'clothing-men-pants', value: 'Pants', count: 3 },
					{
						id: 'clothing-men-outerwear',
						value: 'Outerwear',
						count: 2,
					},
				],
			},
			{
				id: 'clothing-kids',
				value: 'Kids',
				count: 9,
				children: [
					{ id: 'clothing-kids-baby', value: 'Baby', count: 4 },
					{ id: 'clothing-kids-school', value: 'School', count: 5 },
				],
			},
		],
	},
	{
		id: 'home-kitchen',
		value: 'Home & Kitchen',
		count: 12,
		children: [
			{ id: 'home-kitchen-cookware', value: 'Cookware', count: 4 },
			{ id: 'home-kitchen-tabletop', value: 'Tabletop', count: 3 },
			{ id: 'home-kitchen-storage', value: 'Storage', count: 3 },
			{ id: 'home-kitchen-linens', value: 'Linens', count: 2 },
		],
	},
	{
		id: 'electronics',
		value: 'Electronics',
		count: 10,
		children: [
			{ id: 'electronics-audio', value: 'Audio', count: 3 },
			{ id: 'electronics-computers', value: 'Computers', count: 4 },
			{ id: 'electronics-accessories', value: 'Accessories', count: 3 },
		],
	},
	{
		id: 'beauty',
		value: 'Beauty',
		count: 9,
		children: [
			{ id: 'beauty-skincare', value: 'Skincare', count: 4 },
			{ id: 'beauty-makeup', value: 'Makeup', count: 3 },
			{ id: 'beauty-haircare', value: 'Haircare', count: 2 },
		],
	},
	{
		id: 'office',
		value: 'Office',
		count: 8,
		children: [
			{ id: 'office-supplies', value: 'Supplies', count: 3 },
			{ id: 'office-furniture', value: 'Furniture', count: 3 },
			{ id: 'office-organization', value: 'Organization', count: 2 },
		],
	},
	{
		id: 'sale',
		value: 'Sale',
		count: 11,
		children: [
			{ id: 'sale-clearance', value: 'Clearance', count: 4 },
			{ id: 'sale-seasonal', value: 'Seasonal', count: 4 },
			{ id: 'sale-limited-time', value: 'Limited time', count: 3 },
		],
	},
];
