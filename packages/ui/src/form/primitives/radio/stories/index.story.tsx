import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadioGroup } from '@base-ui/react/radio-group';
import { Radio } from '../';

const meta: Meta< typeof Radio > = {
	title: 'Design System/Components/Form/Primitives/Radio',
	component: Radio,
	parameters: {
		// FIXME: Stories show the radio primitive without a visible label (aria-toggle-field-name).
		// See: https://github.com/WordPress/gutenberg/issues/81596
		a11y: { test: 'todo' },
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of style consistency with `@wordpress/components` and component set completeness. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135). Radio must be rendered inside a RadioGroup, which will be added to the package later.',
		},
	},
};

export default meta;

type Story = StoryObj< typeof Radio >;

export const Default: Story = {
	args: {
		value: 'option',
	},
	render: ( args ) => (
		<RadioGroup>
			<Radio { ...args } />
		</RadioGroup>
	),
};

export const Checked: Story = {
	args: {
		value: 'option',
	},
	render: ( args ) => (
		<RadioGroup defaultValue="option">
			<Radio { ...args } />
		</RadioGroup>
	),
};

export const Disabled: Story = {
	args: {
		value: 'option',
		disabled: true,
	},
	render: ( args ) => (
		<RadioGroup>
			<Radio { ...args } />
		</RadioGroup>
	),
};

export const DisabledChecked: Story = {
	args: {
		value: 'option',
		disabled: true,
	},
	render: ( args ) => (
		<RadioGroup defaultValue="option">
			<Radio { ...args } />
		</RadioGroup>
	),
};
