/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import { View } from '../../view';
import { VStack } from '..';

const meta: ComponentMeta< typeof VStack > = {
	component: VStack,
	title: 'Components (Experimental)/VStack',
	argTypes: {
		alignment: { control: { type: 'text' } },
		as: { control: { type: 'text' } },
		direction: { control: { type: 'text' } },
		justify: { control: { type: 'text' } },
		spacing: { control: { type: 'text' } },
	},
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: ComponentStory< typeof VStack > = ( props ) => {
	return (
		<VStack { ...props }>
			<View>One</View>
			<View>Two</View>
			<View>Three</View>
			<View>Four</View>
			<View>Five</View>
		</VStack>
	);
};

export const Default = Template.bind( {} );
