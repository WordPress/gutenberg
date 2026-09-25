import type { Meta, StoryObj } from '@storybook/react-vite';
import { Switch } from '../';

const meta: Meta< typeof Switch > = {
	title: 'Components/@wordpress-ui/Form/Primitives/Switch',
	id: 'design-system-components-form-primitives-switch',
	component: Switch,
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of style consistency with `@wordpress/components` and component set completeness. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135).',
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
