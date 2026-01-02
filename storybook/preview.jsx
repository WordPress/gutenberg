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
import { WithMarginChecker } from './decorators/with-margin-checker';
import { WithMaxWidthWrapper } from './decorators/with-max-width-wrapper';
import { WithRTL } from './decorators/with-rtl';
import { WithTheme } from './decorators/with-theme';
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
	WithMarginChecker,
	WithRTL,
	WithMaxWidthWrapper,
	WithTheme,
	WithDesignSystemTheme,
];

export const parameters = {
	controls: {
		sort: 'requiredFirst',
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
			],
		},
	},
	sourceLink: {
		links: {
			// Disable default links
			'component-vscode': () => undefined,
			'story-vscode': () => undefined,
			'addon-powered-by': () => undefined,
			// Custom GitHub link
			'story-github': ( { importPath } ) => {
				if ( ! importPath ) {
					return undefined;
				}
				// importPath is like "../packages/components/src/button/stories/index.story.tsx"
				// Convert to component directory path: "packages/components/src/button"
				const componentPath = importPath
					.replace( /^\.\.\//, '' ) // Remove leading "../"
					.replace( /^\.\//, '' ) // Remove leading "./" (for stories in storybook folder)
					.replace( /\/stories\/.*$/, '' ); // Remove "/stories/..." suffix
				return {
					label: 'View source',
					href: `https://github.com/WordPress/gutenberg/blob/trunk/${ componentPath }`,
					icon: 'GithubIcon',
				};
			},
		},
	},
};

export const tags = [ 'autodocs' ];
