/**
 * How a section's content relates to the pull request.
 *
 * `commit` content is only true of the commit it was produced from, so it
 * carries a SHA and goes stale. `pr-state` content describes the pull request
 * as it currently is, so it is only ever current or absent.
 */
export type SectionScope = 'commit' | 'pr-state';

export type SectionDefinition = {
	id: string;
	/* Led by an emoji, so a reader can pick out their section at a glance. */
	heading: string;
	scope: SectionScope;
	/** Maximum characters of rendered body before the section is truncated. */
	budget: number;
	/** Label for a section long enough to collapse. Omitted leaves it open. */
	summary?: string;
};

/*
 * Render order, independent of the order the workflows finish in. The two a
 * human acts on lead: the welcome greets a first-time contributor, and props
 * is copied out by hand at merge time.
 */
export const SECTIONS: SectionDefinition[] = [
	{
		id: 'welcome',
		heading: '👋 Welcome',
		scope: 'pr-state',
		budget: 2000,
	},
	{
		id: 'props',
		heading: '🎉 Props',
		scope: 'pr-state',
		budget: 8000,
	},
	{
		id: 'labels',
		heading: '🏷️ Labels',
		scope: 'pr-state',
		budget: 2000,
	},
	{
		id: 'account-link',
		heading: '🔗 WordPress.org profile',
		scope: 'pr-state',
		budget: 2000,
	},
	{
		id: 'bundle-size',
		heading: '📦 Bundle size',
		scope: 'commit',
		budget: 12000,
	},
	{
		id: 'performance',
		heading: '⚡ Performance',
		scope: 'commit',
		budget: 12000,
		summary: 'Show the results',
	},
	{
		id: 'flaky-tests',
		heading: '🏁 Flaky tests',
		scope: 'commit',
		budget: 16000,
		summary: 'Show the failures',
	},
];

/**
 * GitHub rejects a comment body longer than this.
 *
 * @see https://docs.github.com/en/rest/issues/comments
 */
export const COMMENT_LIMIT = 65536;

export function getSection( id: string ): SectionDefinition | undefined {
	return SECTIONS.find( ( section ) => section.id === id );
}
