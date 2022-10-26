/**
 * Internal dependencies
 */
import { WithGlobalCSS } from './decorators/with-global-css';
import { WithMarginChecker } from './decorators/with-margin-checker';
import { WithMaxWidthWrapper } from './decorators/with-max-width-wrapper';
import { WithRTL } from './decorators/with-rtl';
import { WithTheme } from './decorators/with-theme';
import './style.scss';

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
	componentsTheme: {
		name: 'Theme',
		description: 'Change the components theme. (Work in progress)',
		defaultValue: 'default',
		toolbar: {
			icon: 'paintbrush',
			items: [
				{ value: 'default', title: 'Default' },
				{ value: 'modern', title: 'Modern' },
				{ value: 'sunrise', title: 'Sunrise' },
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
	marginChecker: {
		name: 'Margin Checker',
		description:
			'Show a div before and after the component to check for unwanted margins.',
		defaultValue: 'hide',
		toolbar: {
			icon: 'collapse',
			items: [
				{ value: 'hide', title: 'Hide' },
				{ value: 'show', title: 'Show' },
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
			],
		},
	},
};

export const decorators = [
	WithTheme,
	WithGlobalCSS,
	WithMarginChecker,
	WithRTL,
	WithMaxWidthWrapper,
];

export const parameters = {
	controls: {
		sort: 'requiredFirst',
	},
	knobs: {
		// Knobs are deprecated, and new stories should use addon-controls.
		// Will be enabled on a per-story basis until migration is complete.
		disable: true,
	},
	options: {
		storySort: {
			order: [
				'Docs',
				'Playground',
				'BlockEditor',
				'Components',
				'Components (Experimental)',
				'Icons',
			],
		},
	},
};
