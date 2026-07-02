import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '../..';

const meta: Meta< typeof Badge > = {
	title: 'Design System/Components/Badge',
	component: Badge,
};
export default meta;

type Story = StoryObj< typeof Badge >;

export const TextOverflow: Story = {
	args: {
		children:
			'This is an extremely long label thatshoulddemonstratetextoverflow behavior',
	},
	parameters: {
		textOverflowContainers: true,
	},
};
