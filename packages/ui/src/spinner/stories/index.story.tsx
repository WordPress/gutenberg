import type { Meta, StoryObj } from '@storybook/react-vite';
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
	args: { color: 'rebeccapurple' },
};

export const CurrentColor: Story = {
	args: { color: 'currentColor' },
	render: ( args ) => (
		<div
			style={ { color: 'var(--wpds-color-foreground-content-neutral)' } }
		>
			<Spinner { ...args } />
		</div>
	),
};
