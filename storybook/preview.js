/**
 * External dependencies
 */
import {
	ArgsTable,
	Description,
	Primary,
	Stories,
	Subtitle,
	Title,
} from '@storybook/blocks';

/**
 * Internal dependencies
 */
import { WithGlobalCSS } from './decorators/with-global-css';
import { WithMarginChecker } from './decorators/with-margin-checker';
import { WithMaxWidthWrapper } from './decorators/with-max-width-wrapper';
import { WithRTL } from './decorators/with-rtl';
import { WithTheme } from './decorators/with-theme';

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
				{ value: 'darkBg', title: 'Dark (background)' },
				{ value: 'lightGrayBg', title: 'Light gray (background)' },
				{ value: 'classic', title: 'Classic (accent)' },
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
	WithGlobalCSS,
	WithMarginChecker,
	WithRTL,
	WithMaxWidthWrapper,
	WithTheme,
];

export const parameters = {
	// For @geometricpanda/storybook-addon-badges
	badgesConfig: {
		private: {
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
			title: '🚧 WIP',
			styles: { backgroundColor: '#FFF0BD' },
			tooltip: {
				title: 'Component is a work in progress',
				desc: 'This component is not ready for use in production, including the Gutenberg codebase. DO NOT export outside of @wordpress/components.',
			},
		},
	},
	controls: {
		sort: 'requiredFirst',
	},
	docs: {
		// Flips the order of the description and the primary component story
		// so the component is always visible before the fold.
		page: () => (
			<>
				<Title />
				<Subtitle />
				<Primary />
				<Description />
				{ /* `story="^"` enables Controls for the primary props table */ }
				<ArgsTable story="^" />
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
				'Components (Experimental)',
				'Icons',
			],
		},
	},
	sourceLinkPrefix: 'https://github.com/WordPress/gutenberg/blob/trunk/',
};
