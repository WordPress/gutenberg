import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from '../index';
import { InputLayout } from '../../input-layout';
import { WithSuffixControl as InputLayoutWithSuffixControl } from '../../input-layout/stories/index.story';

const meta: Meta< typeof Input > = {
	tags: [ 'manifest' ],
	title: 'Design System/Components/Form/Primitives/Input',
	component: Input,
	// Temporary: Due to an upstream bug, render the root explicitly so the
	// components manifest extractor can resolve props from the JSX.
	//
	// See: https://github.com/storybookjs/storybook/issues/34877
	render: ( args ) => <Input { ...args } />,
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

export const WithSuffixControl: Story = {
	args: {
		suffix: InputLayoutWithSuffixControl.args?.suffix,
	},
	parameters: {
		// FIXME: Story shows Input without a visible label (label).
		// See: https://github.com/WordPress/gutenberg/issues/81596
		a11y: { test: 'todo' },
	},
};

export const Disabled: Story = {
	args: {
		...Default.args,
		disabled: true,
	},
};
