export interface FixtureItem {
	id: string;
	value: string;
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
