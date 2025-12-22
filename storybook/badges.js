/**
 * Provides badge configuration options.
 *
 * To apply a badge to a story, add a badge identifier prefixed by "status-" to
 * the `tags` array in the story's metadata. For example, to apply the "private"
 * badge, add "status-private" to the `tags` array.
 *
 * @see https://github.com/Sidnioulz/storybook-addon-tag-badges
 */

/**
 * Badge definitions used by sidebar.js for rendering icons.
 */
const badges = {
	private: {
		icon: '🔒',
		title: '🔒 Private',
		tooltip: {
			title: 'Component is locked as a private API',
			desc: 'We do not yet recommend using this outside of the Gutenberg codebase.',
			links: [
				{
					title: 'About @wordpress/private-apis',
					href: 'https://developer.wordpress.org/block-editor/reference-guides/packages/packages-private-apis/',
				},
			],
		},
	},
	wip: {
		icon: '🚧',
		title: '🚧 WIP',
		styles: { backgroundColor: '#FFF0BD' },
		tooltip: {
			title: 'Component is a work in progress',
			desc: 'This component is not ready for use in production, including the Gutenberg codebase. DO NOT export outside of @wordpress/components.',
		},
	},
	experimental: {
		icon: '🧪',
		title: '🧪 Experimental',
		tooltip: {
			title: 'Component is experimental',
			desc: 'This component is under active development and may change in future releases.',
		},
	},
};

export default badges;

/**
 * Tag badge configurations for storybook-addon-tag-badges.
 * Used by manager.js to configure the addon.
 */
export const tagBadges = [
	{
		tags: 'status-private',
		badge: {
			text: badges.private.title,
			tooltip: badges.private.tooltip,
		},
	},
	{
		tags: 'status-wip',
		badge: {
			text: badges.wip.title,
			style: badges.wip.styles,
			tooltip: badges.wip.tooltip,
		},
	},
	{
		tags: 'status-experimental',
		badge: {
			text: badges.experimental.title,
			tooltip: badges.experimental.tooltip,
		},
	},
];
