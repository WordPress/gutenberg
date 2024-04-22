/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';
/**
 * Internal dependencies
 */
import { DimensionControl } from '..';
import sizes from '../sizes';

/**
 * WordPress dependencies
 */
import { desktop, tablet, mobile } from '@wordpress/icons';

export default {
	component: DimensionControl,
	title: 'Components (Experimental)/DimensionControl',
	argTypes: {
		onChange: { action: 'onChange' },
		value: { control: { type: null } },
		icon: {
			control: { type: 'select' },
			options: [ '-', 'desktop', 'tablet', 'mobile' ],
			mapping: {
				'-': undefined,
				desktop,
				tablet,
				mobile,
			},
		},
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
} as Meta< typeof DimensionControl >;

const Template: StoryFn< typeof DimensionControl > = ( args ) => (
	<DimensionControl { ...args } />
);

export const Default = Template.bind( {} );

Default.args = {
	label: 'Please select a size',
	sizes,
};
