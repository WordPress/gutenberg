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
