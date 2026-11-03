import type { Meta, StoryObj } from '@storybook/react-vite';
import { Radio } from '../';
import { RadioGroup } from '../../radio-group';

const meta: Meta< typeof Radio > = {
	tags: [ 'manifest' ],
	title: 'Components/@wordpress-ui/Form/Primitives/Radio',
	id: 'design-system-components-form-primitives-radio',
	component: Radio,
	parameters: {
		componentStatus: {
			status: 'recommended',
			whereUsed: 'global',
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
