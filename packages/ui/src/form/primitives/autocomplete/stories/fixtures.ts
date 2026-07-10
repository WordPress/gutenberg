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
