import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from '../';

const meta: Meta< typeof Checkbox > = {
	tags: [ 'manifest' ],
	title: 'Components/@wordpress-ui/Form/Primitives/Checkbox',
	id: 'design-system-components-form-primitives-checkbox',
	component: Checkbox,
	argTypes: {
		onCheckedChange: { action: 'onCheckedChange' },
	},
	parameters: {
		componentStatus: {
			status: 'recommended',
			whereUsed: 'global',
		},
	},
};

export default meta;

type Story = StoryObj< typeof Checkbox >;

export const Default: Story = {
	args: {
		'aria-label': 'Option',
	},
};

export const Checked: Story = {
	args: {
		...Default.args,
		defaultChecked: true,
	},
};

export const Indeterminate: Story = {
	args: {
		...Default.args,
		indeterminate: true,
	},
};

export const Disabled: Story = {
	args: {
		...Default.args,
		disabled: true,
	},
};

export const DisabledChecked: Story = {
	args: {
		...Default.args,
		disabled: true,
		defaultChecked: true,
	},
};
