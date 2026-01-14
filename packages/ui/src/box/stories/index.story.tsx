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

export const WithElevation: Story = {
	render: () => (
		<div style={ { display: 'flex', gap: '24px', flexWrap: 'wrap' } }>
			<Box
				backgroundColor="neutral"
				padding="md"
				borderRadius="md"
				elevation="x-small"
			>
				Elevation: x-small
			</Box>
			<Box
				backgroundColor="neutral"
				padding="md"
				borderRadius="md"
				elevation="small"
			>
				Elevation: small
			</Box>
			<Box
				backgroundColor="neutral"
				padding="md"
				borderRadius="md"
				elevation="medium"
			>
				Elevation: medium
			</Box>
			<Box
				backgroundColor="neutral"
				padding="md"
				borderRadius="md"
				elevation="large"
			>
				Elevation: large
			</Box>
		</div>
	),
};
