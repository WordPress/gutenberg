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
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of style consistency with `@wordpress/components` and component set completeness. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135). Radio must be rendered inside a RadioGroup, which will be added to the package later.',
		},
	},
};

export default meta;

type Story = StoryObj< typeof Radio >;

export const Default: Story = {
	args: {
		value: 'option',
		'aria-label': 'Option',
	},
	render: ( args ) => (
		<RadioGroup aria-label="Options">
			<Radio { ...args } />
		</RadioGroup>
	),
};

export const Checked: Story = {
	args: {
		...Default.args,
	},
	render: ( args ) => (
		<RadioGroup aria-label="Options" defaultValue="option">
			<Radio { ...args } />
		</RadioGroup>
	),
};

export const Disabled: Story = {
	args: {
		...Default.args,
		disabled: true,
	},
	render: ( args ) => (
		<RadioGroup aria-label="Options">
			<Radio { ...args } />
		</RadioGroup>
	),
};

export const DisabledChecked: Story = {
	args: {
		...Default.args,
		disabled: true,
	},
	render: ( args ) => (
		<RadioGroup aria-label="Options" defaultValue="option">
			<Radio { ...args } />
		</RadioGroup>
	),
};
