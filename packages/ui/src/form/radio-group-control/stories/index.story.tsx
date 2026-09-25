import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadioGroupControl } from '../';
import {
	WITH_DETAILS_DESCRIPTION,
	DETAILS_EXAMPLE,
} from '../../stories/shared';

const meta: Meta< typeof RadioGroupControl > = {
	title: 'Components/@wordpress-ui/Form/RadioGroupControl',
	id: 'design-system-components-form-radiogroupcontrol',
	component: RadioGroupControl,
	argTypes: {
		onValueChange: { action: 'onValueChange' },
		value: { control: false },
		defaultValue: { control: false },
	},
};
export default meta;

type Story = StoryObj< typeof RadioGroupControl >;

const defaultItems = [
	{
		label: 'Apple',
		value: 'apple',
		description: 'This is the description for the apple.',
	},
	{
		label: 'Banana',
		value: 'banana',
		description: 'This is the description for the banana.',
	},
];

export const Default: Story = {
	args: {
		label: 'Label',
		items: defaultItems,
	},
};

export const WithDescription: Story = {
	args: {
		...Default.args,
		description: 'This is the description for the entire fieldset.',
	},
};

export const WithLongLabel: Story = {
	args: {
		...Default.args,
		items: [
			{
				label: 'This is a long label that should wrap to the next line. This is a long label that should wrap to the next line. This is a long label that should wrap to the next line.',
				value: 'apple',
			},
			{
				label: 'Banana',
				value: 'banana',
			},
		],
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

export const WithDisabledItem: Story = {
	args: {
		...Default.args,
		items: [
			{
				label: 'Apple',
				value: 'apple',
			},
			{
				label: 'Banana',
				value: 'banana',
				description: 'This item is disabled.',
				disabled: true,
			},
			{
				label: 'Orange',
				value: 'orange',
			},
		],
	},
};

export const Disabled: Story = {
	args: {
		...Default.args,
		disabled: true,
	},
};
