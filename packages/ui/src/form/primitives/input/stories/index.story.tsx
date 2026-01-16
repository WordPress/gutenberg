import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input, InputLayout } from '../../../..';

const meta: Meta< typeof Input > = {
	title: 'Design System/Components/Form/Primitives/Input',
	component: Input,
	argTypes: {
		defaultValue: { control: false },
		onValueChange: { action: 'onValueChange' },
		value: { control: false },
		type: { control: 'text' },
	},
};
export default meta;

type Story = StoryObj< typeof Input >;

export const Default: Story = {
	args: {
		placeholder: 'Placeholder',
	},
};

/**
 * The `InputLayout.Slot` component can be used to add standard padding in
 * the `prefix` or `suffix` slot.
 */
export const WithPrefix: Story = {
	args: {
		placeholder: 'username',
		prefix: <InputLayout.Slot>@</InputLayout.Slot>,
	},
};

export const Disabled: Story = {
	args: {
		...Default.args,
		disabled: true,
	},
};
