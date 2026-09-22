import type { Meta, StoryObj } from '@storybook/react-vite';
import { SwitchControl } from '../';
import {
	WITH_DETAILS_DESCRIPTION,
	DETAILS_EXAMPLE,
} from '../../stories/shared';

const meta: Meta< typeof SwitchControl > = {
	title: 'Components/@wordpress-ui/Form/SwitchControl',
	id: 'design-system-components-form-switchcontrol',
	component: SwitchControl,
	argTypes: {
		checked: { control: false },
		onCheckedChange: { action: 'onCheckedChange' },
	},
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of style consistency with `@wordpress/components` and component set completeness. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135).',
		},
	},
};
export default meta;

type Story = StoryObj< typeof SwitchControl >;

export const Default: Story = {
	args: {
		label: 'Label',
	},
};

export const WithDescription: Story = {
	args: {
		...Default.args,
		description: 'This is the description.',
	},
};

export const WithLongLabel: Story = {
	args: {
		...Default.args,
		label: 'This is a long label that should wrap to the next line. This is a long label that should wrap to the next line. This is a long label that should wrap to the next line.',
	},
};

export const VisuallyHiddenLabel: Story = {
	args: {
		...Default.args,
		hideLabelFromVision: true,
	},
};

export const WithDetails: Story = {
	parameters: {
		docs: { description: { story: WITH_DETAILS_DESCRIPTION } },
	},
	args: {
		...Default.args,
		details: DETAILS_EXAMPLE,
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
