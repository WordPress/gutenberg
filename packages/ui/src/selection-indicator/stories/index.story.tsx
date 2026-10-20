import type { Meta, StoryObj } from '@storybook/react-vite';
import { SelectionIndicator } from '../';

const meta: Meta< typeof SelectionIndicator > = {
	tags: [ 'manifest' ],
	title: 'Components/@wordpress-ui/SelectionIndicator',
	id: 'design-system-components-selection-indicator',
	component: SelectionIndicator,
	parameters: {
		componentStatus: {
			status: 'recommended',
			whereUsed: 'global',
		},
	},
};
export default meta;

type Story = StoryObj< typeof SelectionIndicator >;

export const Default: Story = {};

export const Checked: Story = {
	args: { checked: true },
};

export const Radio: Story = {
	args: { type: 'radio' },
};

export const CheckedRadio: Story = {
	args: { type: 'radio', checked: true },
};
