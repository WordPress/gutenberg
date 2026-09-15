/**
 * Provides badge configuration options.
 *
 * To apply a badge to a story, add a badge identifier prefixed by "status-" to
 * the `tags` array in the story's metadata. For example, to apply the "private"
 * badge, add "status-private" to the `tags` array.
 *
 * @see https://github.com/Sidnioulz/storybook-addon-tag-badges
 */

import { statuses } from './components/component-status-indicator/statuses';

/**
 * Recommendation statuses, declared per story as
 * `parameters.componentStatus`. The status indexer turns them into
 * `status-<value>` tags at index time, so they need no `tags` entry.
 */
const statusDescriptions = {
	recommended: 'Use this component for new UI.',
	'use-with-caution': 'Use with care; check the notes on the component page.',
	'not-recommended':
		'Do not use for new UI. The component page points at the recommended alternative.',
	unaudited: 'Not audited yet against the design system.',
};

const statusBadges = Object.fromEntries(
	Object.entries( statuses ).map( ( [ key, { label, icon } ] ) => [
		key,
		{
			icon,
			title: `${ icon } ${ label }`,
			tooltip: {
				title: `Component status: ${ label }`,
				desc: statusDescriptions[ key ],
			},
		},
	] )
);

/**
 * Badge definitions used by sidebar.js for rendering icons.
 */
const badges = {
	...statusBadges,
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
