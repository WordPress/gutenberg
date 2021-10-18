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
