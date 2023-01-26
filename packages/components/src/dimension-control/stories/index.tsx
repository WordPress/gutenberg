/**
 * WordPress dependencies
 */
/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';
/**
 * Internal dependencies
 */
import { DimensionControl } from '..';
import sizes from '../sizes';

export default {
	component: DimensionControl,
	title: 'Components (Experimental)/DimensionControl',
	argTypes: {
		onChange: { action: 'onChange' },
		value: { control: { type: null } },
	},
} as ComponentMeta< typeof DimensionControl >;

const Template: ComponentStory< typeof DimensionControl > = ( args ) => (
	<DimensionControl { ...args } />
);

export const Default = Template.bind( {} );

Default.args = {
	label: 'Please select a size',
	sizes,
};

export const CustomSizes = Template.bind( {} );

CustomSizes.args = {
	label: 'How tall are you?',
	sizes: [
		{
			name: 'Tall',
			slug: 'tall',
		},
		{
			name: 'Very Tall',
			slug: 'very-tall',
		},
		{
			name: 'Very Very Tall',
			slug: 'very-very-tall',
		},
	],
};
