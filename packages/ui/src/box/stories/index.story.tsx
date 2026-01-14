import { type Meta, type StoryObj } from '@storybook/react-webpack5';
import { type PaddingSize } from '@wordpress/theme';
import { Box } from '../box';

const meta: Meta< typeof Box > = {
	title: 'Design System/Components/Box',
	component: Box,
};
export default meta;

type Story = StoryObj< typeof Box >;

export const Default: Story = {
	args: {
		children: 'Box',
		backgroundColor: 'info',
		color: 'info',
		padding: 'sm',
		borderColor: 'brand',
		borderRadius: 'md',
		borderWidth: 'sm',
	},
	argTypes: {
		padding: {
			control: 'select',
			options: [ '2xs', 'xs', 'sm', 'md', 'lg' ] satisfies PaddingSize[],
		},
	},
};

export const DirectionalPadding: Story = {
	...Default,
	args: {
		...Default.args,
		padding: {
			blockStart: 'sm',
			inline: 'md',
			blockEnd: 'lg',
		},
	},
};
