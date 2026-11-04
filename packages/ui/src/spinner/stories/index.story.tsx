import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stack } from '../../stack';
import { Spinner } from '../index';

const meta: Meta< typeof Spinner > = {
	tags: [ 'manifest' ],
	title: 'Components/@wordpress-ui/Spinner',
	id: 'design-system-components-spinner',
	component: Spinner,
	argTypes: {
		color: { control: 'text' },
	},
	parameters: {
		componentStatus: {
			status: 'recommended',
		},
	},
};
export default meta;

type Story = StoryObj< typeof Spinner >;

export const Default: Story = {};

export const CustomSize: Story = {
	args: {
		style: {
			width: 'var(--wpds-dimension-size-lg)',
			height: 'var(--wpds-dimension-size-lg)',
		},
	},
};

export const CustomColor: Story = {
	args: { color: '#d92d20' },
};

export const CurrentColor: Story = {
	args: { color: 'currentColor' },
	render: ( args ) => (
		<Stack
			direction="row"
			gap="sm"
			align="center"
			style={ { color: '#7f32c9' } }
		>
			<Spinner { ...args } />
			<span>Loading…</span>
		</Stack>
	),
};
