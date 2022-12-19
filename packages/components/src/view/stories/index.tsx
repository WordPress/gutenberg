/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import { View } from '..';

const meta: ComponentMeta< typeof View > = {
	component: View,
	title: 'Components (Experimental)/View',
	argTypes: {
		as: { control: { type: null } },
		children: { control: { type: 'text' } },
	},
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: ComponentStory< typeof View > = ( args ) => {
	return <View { ...args } />;
};

export const Default: ComponentStory< typeof View > = Template.bind( {} );
Default.args = {
	children: 'An example tip',
};
