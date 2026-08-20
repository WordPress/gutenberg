import type { Meta, StoryObj } from '@storybook/react-vite';
import { ValidityIndicator } from '../index';

const meta: Meta< typeof ValidityIndicator > = {
	tags: [ 'manifest' ],
	title: 'Design System/Components/Form/Primitives/ValidityIndicator',
	component: ValidityIndicator,
	// Temporary: Due to an upstream bug, render the root explicitly so the
	// components manifest extractor can resolve props from the JSX.
	//
	// See: https://github.com/storybookjs/storybook/issues/34877
	render: ( args ) => <ValidityIndicator { ...args } />,
	parameters: {
		componentStatus: {
			status: 'recommended',
		},
	},
};
export default meta;

type Story = StoryObj< typeof ValidityIndicator >;

export const Invalid: Story = {
	args: {
		type: 'invalid',
		message: 'Please enter a valid URL.',
	},
};

export const Valid: Story = {
	args: {
		type: 'valid',
		message: 'This URL is available.',
	},
};

export const Validating: Story = {
	args: {
		type: 'validating',
		message: 'Checking availability…',
	},
};
