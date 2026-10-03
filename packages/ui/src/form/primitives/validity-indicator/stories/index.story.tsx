import type { Meta, StoryObj } from '@storybook/react-vite';
import { ValidityIndicator } from '../index';

const meta: Meta< typeof ValidityIndicator > = {
	tags: [ 'manifest' ],
	title: 'Components/@wordpress-ui/Form/Primitives/ValidityIndicator',
	id: 'design-system-components-form-primitives-validityindicator',
	component: ValidityIndicator,
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
