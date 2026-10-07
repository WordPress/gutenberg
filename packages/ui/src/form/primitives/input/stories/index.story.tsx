import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from '../index';
import { InputLayout } from '../../input-layout';
import { WithSuffixControl as InputLayoutWithSuffixControl } from '../../input-layout/stories/index.story';

const meta: Meta< typeof Input > = {
	tags: [ 'manifest' ],
	title: 'Components/@wordpress-ui/Form/Primitives/Input',
	id: 'design-system-components-form-primitives-input',
	component: Input,
	argTypes: {
		defaultValue: { control: false },
		onValueChange: { action: 'onValueChange' },
		value: { control: false },
		type: { control: 'text' },
	},
	parameters: {
		componentStatus: {
			status: 'recommended',
			whereUsed: 'global',
		},
	},
};
export default meta;

type Story = StoryObj< typeof Input >;

export const Default: Story = {
	args: {
		placeholder: 'Placeholder',
		'aria-label': 'Value',
	},
};

/**
 * The `InputLayout.Slot` component can be used to add standard padding in
 * the `prefix` or `suffix` slot.
 */
export const WithPrefix: Story = {
	args: {
		placeholder: 'username',
		'aria-label': 'Username',
		prefix: <InputLayout.Slot>@</InputLayout.Slot>,
	},
};

export const WithSuffixControl: Story = {
	args: {
		'aria-label': 'Value',
		suffix: InputLayoutWithSuffixControl.args?.suffix,
	},
};

export const Disabled: Story = {
	args: {
		...Default.args,
		disabled: true,
	},
};
