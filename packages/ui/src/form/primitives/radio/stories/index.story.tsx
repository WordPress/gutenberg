import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadioGroup } from '@base-ui/react/radio-group';
import { Radio } from '../';

const meta: Meta< typeof Radio > = {
	title: 'Design System/Components/Form/Primitives/Radio',
	component: Radio,
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of style consistency with `@wordpress/components` and component set completeness. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135). Must be rendered inside a `RadioGroup` (coming to the package later).',
		},
	},
};

export default meta;

type Story = StoryObj< typeof Radio >;

export const Default: Story = {
	render: ( args ) => (
		<RadioGroup>
			<Radio { ...args } />
		</RadioGroup>
	),
	args: {
		value: 'option',
	},
};

export const Checked: Story = {
	render: ( args ) => (
		<RadioGroup defaultValue="option">
			<Radio { ...args } />
		</RadioGroup>
	),
	args: {
		value: 'option',
	},
};

export const Disabled: Story = {
	render: ( args ) => (
		<RadioGroup>
			<Radio { ...args } />
		</RadioGroup>
	),
	args: {
		value: 'option',
		disabled: true,
	},
};

export const DisabledChecked: Story = {
	render: ( args ) => (
		<RadioGroup defaultValue="option">
			<Radio { ...args } />
		</RadioGroup>
	),
	args: {
		value: 'option',
		disabled: true,
	},
};
