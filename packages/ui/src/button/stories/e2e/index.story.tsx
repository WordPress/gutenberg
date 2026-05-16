import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../..';

const meta: Meta< typeof Button > = {
	title: 'Design System/Components/Button',
	component: Button,
};
export default meta;

type Story = StoryObj< typeof Button >;

export const TextOverflow: Story = {
	args: {
		children:
			'This is an extremely long label thatshoulddemonstratetextoverflow behavior',
	},
	parameters: {
		textOverflowContainers: true,
	},
};
