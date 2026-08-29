import type { Meta, StoryObj } from '@storybook/react-vite';
import { CheckboxControl } from '../';
import {
	WITH_DETAILS_DESCRIPTION,
	DETAILS_EXAMPLE,
} from '../../stories/shared';

const meta: Meta< typeof CheckboxControl > = {
	tags: [ 'manifest' ],
	title: 'Design System/Components/Form/CheckboxControl',
	component: CheckboxControl,
	argTypes: {
		checked: { control: false },
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

type Story = StoryObj< typeof CheckboxControl >;

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
