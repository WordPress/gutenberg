import type { Meta, StoryObj } from '@storybook/react-vite';
import { Spinner } from '../index';

const meta: Meta< typeof Spinner > = {
	tags: [ 'manifest' ],
	title: 'Design System/Components/Spinner',
	component: Spinner,
	parameters: {
		componentStatus: {
			status: 'recommended',
			whereUsed: 'global',
		},
	},
};
export default meta;

type Story = StoryObj< typeof Spinner >;

export const Default: Story = {};

// The Spinner can be resized to any size, but the stroke width will remain unchanged.
export const CustomSize: Story = {
	args: {
		style: {
			width: 'var(--wpds-dimension-size-lg)',
			height: 'var(--wpds-dimension-size-lg)',
		},
	},
};
