import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stack } from '../../../../stack';
import * as Field from '../../field';
import * as Checkbox from '../';

const meta: Meta< typeof Checkbox.Root > = {
	title: 'Design System/Components/Form/Primitives/Checkbox',
	component: Checkbox.Root,
	subcomponents: {
		Indicator: Checkbox.Indicator,
	},
	argTypes: {
		onCheckedChange: { action: 'onCheckedChange' },
	},
};
export default meta;

type Story = StoryObj< typeof Checkbox.Root >;

export const Default: Story = {
	args: {
		'aria-label': 'Option',
	},
};

export const Checked: Story = {
	args: {
		...Default.args,
		defaultChecked: true,
	},
};

export const Indeterminate: Story = {
	args: {
		'aria-label': 'Partially selected option',
		indeterminate: true,
	},
};

export const Disabled: Story = {
	args: {
		...Default.args,
		defaultChecked: true,
		disabled: true,
	},
};

const WithLabelExample = () => (
	<Field.Root render={ <Stack direction="row" gap="sm" align="center" /> }>
		<Checkbox.Root />
		<Field.Label variant="plain">Enable option</Field.Label>
	</Field.Root>
);

/**
 * When composed with `Field.Root`, `Field.Label` is automatically associated
 * with the checkbox.
 */
export const WithLabel: Story = {
	render: () => <WithLabelExample />,
};

export const WithCustomIndicator: Story = {
	render: ( args ) => (
		<Checkbox.Root { ...args }>
			<Checkbox.Indicator>✓</Checkbox.Indicator>
		</Checkbox.Root>
	),
	args: {
		...Default.args,
		defaultChecked: true,
	},
};
