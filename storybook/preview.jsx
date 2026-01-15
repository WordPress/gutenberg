import {
	Controls,
	Description,
	Primary,
	Stories,
	Subtitle,
	Title,
} from '@storybook/addon-docs/blocks';

/**
 * Internal dependencies
 */
import { WithGlobalCSS } from './decorators/with-global-css';
import { WithMaxWidthWrapper } from './decorators/with-max-width-wrapper';
import { WithRTL } from './decorators/with-rtl';
import { WithDesignSystemTheme } from './decorators/with-design-system-theme';

export const globalTypes = {
	direction: {
		name: 'RTL',
		description: 'Simulate an RTL language.',
		defaultValue: 'ltr',
		toolbar: {
			icon: 'globe',
			items: [
				{ value: 'ltr', title: 'LTR' },
				{ value: 'rtl', title: 'RTL' },
			],
		},
	},
	css: {
		name: 'Global CSS',
		description:
			'Inject global CSS that may be loaded in certain contexts.',
		defaultValue: 'basic',
		toolbar: {
			icon: 'document',
			items: [
				{ value: 'none', title: 'None' },
				{ value: 'basic', title: 'Font only' },
				{
					value: 'wordpress',
					title: 'WordPress (common, forms, dashicons)',
				},
			],
		},
	},
	maxWidthWrapper: {
		name: 'Max-Width Wrapper',
		description: 'Wrap the component in a div with a max-width.',
		defaultValue: 'none',
		toolbar: {
			icon: 'outline',
			items: [
				{ value: 'none', title: 'None' },
				{ value: 'wordpress-sidebar', title: 'WP Sidebar' },
				{ value: 'small-container', title: 'Small container' },
				{ value: 'large-container', title: 'Large container' },
			],
		},
	},
	dsColorTheme: {},
	dsDensity: {},
};

export const decorators = [
	WithGlobalCSS,
	WithRTL,
	WithMaxWidthWrapper,
	WithDesignSystemTheme,
];

export const parameters = {
	controls: {
		sort: 'requiredFirst',
	},
	backgrounds: {
		disable: true,
	},
	docs: {
		controls: {
			sort: 'requiredFirst',
		},
		// Flips the order of the description and the primary component story
		// so the component is always visible before the fold.
		page: () => (
			<>
				<Title />
				<Subtitle />
				<Primary />
				<Description />
				<Controls />
				<Stories includePrimary={ false } />
			</>
		),
	},
	options: {
		storySort: {
			order: [
				'Docs',
				'Playground',
				'BlockEditor',
				'Components',
				[
					'Introduction',
					'Contributing Guidelines',
					'Actions',
					'Containers',
					'Feedback',
					'Layout',
					'Navigation',
					'Overlays',
					'Selection & Input',
					[
						'Color',
						'Common',
						'File Upload',
						'Time & Date',
						'Validated Form Controls',
						[ 'Overview' ],
					],
					'Typography',
					'Utilities',
				],
				[
					'Actions',
					'Layout',
					'Navigation',
					'Overlays',
					'Selection & Input',
					'Typography',
				],
				'Icons',
				'Design System',
				[ 'Introduction', 'Theme', 'Components', [ 'Introduction' ] ],
			],
		},
	},
};

export const tags = [ 'autodocs' ];
