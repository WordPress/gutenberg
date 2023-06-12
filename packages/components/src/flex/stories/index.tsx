/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import { Flex, FlexItem, FlexBlock } from '../';
import { View } from '../../view';

const meta: ComponentMeta< typeof Flex > = {
	component: Flex,
	title: 'Components/Flex',
	subcomponents: { FlexBlock, FlexItem },
	argTypes: {
		align: { control: { type: 'text' } },
		as: { control: { type: 'text' } },
		children: { control: { type: null } },
		gap: { control: { type: 'text' } },
		justify: { control: { type: 'text' } },
		// Disabled isReversed because it's deprecated.
		isReversed: {
			table: {
				disable: true,
			},
		},
	},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const GrayBox = ( { children }: { children: string } ) => (
	<View style={ { backgroundColor: '#eee', padding: 10 } }>{ children }</View>
);

export const Default: ComponentStory< typeof Flex > = ( { ...args } ) => {
	return (
		<Flex { ...args }>
			<FlexItem>
				<GrayBox>Item 1</GrayBox>
			</FlexItem>
			<FlexItem>
				<GrayBox>Item 2</GrayBox>
			</FlexItem>
			<FlexItem>
				<GrayBox>Item 3</GrayBox>
			</FlexItem>
		</Flex>
	);
};
Default.args = {};

export const ResponsiveDirection: ComponentStory< typeof Flex > = ( {
	...args
} ) => {
	return (
		<Flex { ...args }>
			<FlexItem>
				<GrayBox>Item 1</GrayBox>
			</FlexItem>
			<FlexBlock>
				<GrayBox>Item 2</GrayBox>
			</FlexBlock>
			<FlexItem>
				<GrayBox>Item 3</GrayBox>
			</FlexItem>
			<FlexItem>
				<GrayBox>Item 4</GrayBox>
			</FlexItem>
		</Flex>
	);
};
ResponsiveDirection.args = {
	direction: [ 'column', 'row' ],
};
