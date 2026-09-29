/**
 * Provides badge configuration options, keyed by the tag that triggers them.
 *
 * Tags live in two namespaces, because they answer two different questions.
 * The `status-*` tags describe the API lifecycle, how a component can be
 * imported, and are declared by hand in a story's `tags` array. The `use-*`
 * tags describe the design system's recommendation, whether a component should
 * be used for new UI, and are added at index time from
 * `parameters.componentStatus`. A component can carry one of each.
 *
 * @see https://github.com/Sidnioulz/storybook-addon-tag-badges
 */

import { statuses } from './components/component-status-indicator/statuses';

/**
 * Recommendation statuses, declared per story as
 * `parameters.componentStatus`. The status indexer turns each one into its
 * `use-*` tag at index time, so they need no `tags` entry.
 */
const statusDescriptions = {
	recommended: 'Use this component for new UI.',
	'use-with-caution': 'Use with care; check the notes on the component page.',
	'not-recommended':
		'Do not use for new UI. The component page points at the recommended alternative.',
	unaudited: 'Not audited yet against the design system.',
};

const statusBadges = Object.fromEntries(
	Object.entries( statuses ).map( ( [ key, { label, icon, tag } ] ) => {
		const showIcon = key !== 'recommended';

		return [
			tag,
			{
				...( showIcon && { icon } ),
				title: showIcon ? `${ icon } ${ label }` : label,
				tooltip: {
					title: `Component status: ${ label }`,
					desc: statusDescriptions[ key ],
				},
			},
		];
	} )
);

/**
 * Badge definitions used by sidebar.js for rendering icons.
 */
const badges = {
	...statusBadges,
	'status-private': {
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
	'status-experimental': {
		icon: '🧪',
		title: '🧪 Experimental',
		tooltip: {
			title: 'Component is experimental',
			desc: 'This component is under active development and may change in future releases.',
		},
	},
};

export default badges;
