import type { Meta, StoryObj } from '@storybook/react-vite';
import { Switch } from '../';

const meta: Meta< typeof Switch > = {
	tags: [ 'manifest' ],
	title: 'Components/@wordpress-ui/Form/Primitives/Switch',
	id: 'design-system-components-form-primitives-switch',
	component: Switch,
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

type Story = StoryObj< typeof Switch >;

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
