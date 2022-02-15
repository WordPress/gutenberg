/**
 * Internal dependencies
 */
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
};

export const decorators = [ WithRTL ];

export const parameters = {
	docs: {
		source: {
			state: 'open',
		},
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
