import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextareaControl } from '../index';
import {
	WITH_DETAILS_DESCRIPTION,
	DETAILS_EXAMPLE,
} from '../../stories/shared';

const meta: Meta< typeof TextareaControl > = {
	tags: [ 'manifest' ],
	title: 'Design System/Components/Form/TextareaControl',
	component: TextareaControl,
	// Temporary: Due to an upstream bug, render the root explicitly so the
	// components manifest extractor can resolve props from the JSX.
	//
	// See: https://github.com/storybookjs/storybook/issues/34877
	render: ( args ) => <TextareaControl { ...args } />,
	argTypes: {
		defaultValue: { control: false },
		onValueChange: { action: 'onValueChange' },
		value: { control: false },
	},
	parameters: {
		componentStatus: {
			status: 'recommended',
			whereUsed: 'global',
		},
	},
};
export default meta;

type Story = StoryObj< typeof TextareaControl >;

export const Default: Story = {
	args: {
		label: 'Label',
		description: 'This is the description.',
		placeholder: 'Placeholder',
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
		description: undefined,
		details: DETAILS_EXAMPLE,
	},
};

/**
 * By default, the textarea is resizable in the vertical direction,
 * using the `resize` handle at the bottom right. Although it is possible to modify
 * or disable this [resize behavior through CSS](https://developer.mozilla.org/en-US/docs/Web/CSS/resize),
 * we generally do not recommend it, as the default behavior is best for usability in most cases.
 */
export const Resize: Story = {
	args: {
		...Default.args,
	},
};

export const WithOverflow: Story = {
	args: {
		...Default.args,
		defaultValue: `Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`,
	},
};

export const Disabled: Story = {
	args: {
		...Default.args,
		disabled: true,
	},
};
