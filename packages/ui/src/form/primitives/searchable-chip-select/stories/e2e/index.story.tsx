import type { Meta, StoryObj } from '@storybook/react-vite';
import { SearchableChipSelect } from '../..';
import { ITEMS } from '../fixtures';

const meta: Meta< typeof SearchableChipSelect > = {
	title: 'Design System/Components/Form/Primitives/SearchableChipSelect',
	component: SearchableChipSelect,
};
export default meta;

type Story = StoryObj< typeof SearchableChipSelect >;

export const WithChips: Story = {
	args: {
		defaultValue: [ ITEMS[ 0 ], ITEMS[ 1 ] ],
		items: ITEMS,
		'aria-label': 'Fruit',
	},
};
