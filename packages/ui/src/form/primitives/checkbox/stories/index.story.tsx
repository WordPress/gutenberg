import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from '../';

const meta: Meta< typeof Checkbox > = {
	title: 'Design System/Components/Form/Primitives/Checkbox',
	component: Checkbox,
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of style consistency with `@wordpress/components` and component set completeness. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135).',
		},
	},
};

export default meta;

type Story = StoryObj< typeof Checkbox >;

export const Default: Story = {
	args: {},
};

export const Checked: Story = {
	args: {
		defaultChecked: true,
	},
};

export const Indeterminate: Story = {
	args: {
		indeterminate: true,
	},
};

export const Disabled: Story = {
	args: {
		disabled: true,
	},
};

export const DisabledChecked: Story = {
	args: {
		disabled: true,
		defaultChecked: true,
	},
};
