import type { Meta, StoryObj } from '@storybook/react-vite';
import { Textarea } from '../index';

const meta: Meta< typeof Textarea > = {
	title: 'Design System/Components/Form/Primitives/Textarea',
	component: Textarea,
};
export default meta;

type Story = StoryObj< typeof Textarea >;

export const Default: Story = {
	args: {
		placeholder: 'Placeholder',
	},
};

export const Disabled: Story = {
	args: {
		...Default.args,
		disabled: true,
	},
};

export const WithOverflow: Story = {
	args: {
		...Default.args,
		defaultValue: `Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`,
	},
};

/**
 * When `rows` is set to `1`, the textarea will have the same footprint as a default `Input`.
 */
export const WithOneRow: Story = {
	args: {
		...Default.args,
		rows: 1,
	},
};
