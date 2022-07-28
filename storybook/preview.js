/**
 * Internal dependencies
 */
import { WithGlobalCSS } from './decorators/with-global-css';
import { WithRTL } from './decorators/with-rtl';
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
				{ value: 'wordpress', title: 'WordPress (common/forms)' },
			],
		},
	},
};

export const decorators = [ WithGlobalCSS, WithRTL ];

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
