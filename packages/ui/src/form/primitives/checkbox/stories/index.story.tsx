import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from '../';
import * as Field from '../../field';

const meta: Meta< typeof Checkbox > = {
	title: 'Design System/Components/Form/Primitives/Checkbox',
	component: Checkbox,
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of style consistency with `@wordpress/components` and component set completeness. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135).',
		},
	},
};

export default meta;

type Story = StoryObj< typeof Checkbox >;

// Checkbox has no built-in label; pairing with Field.Label here so each
// example is copy-paste safe. See the Field stories for other labeling
// patterns (htmlFor, aria-labelledby).
export const Default: Story = {
	render: ( args ) => (
		<Field.Root>
			<Field.Label>Accept terms and conditions</Field.Label>
			<Field.Control render={ <Checkbox { ...args } /> } />
		</Field.Root>
	),
	args: {},
};

export const Checked: Story = {
	render: ( args ) => (
		<Field.Root>
			<Field.Label>Accept terms and conditions</Field.Label>
			<Field.Control render={ <Checkbox { ...args } /> } />
		</Field.Root>
	),
	args: {
		defaultChecked: true,
	},
};

export const Indeterminate: Story = {
	render: ( args ) => (
		<Field.Root>
			<Field.Label>Accept terms and conditions</Field.Label>
			<Field.Control render={ <Checkbox { ...args } /> } />
		</Field.Root>
	),
	args: {
		indeterminate: true,
	},
};

export const Disabled: Story = {
	render: ( args ) => (
		<Field.Root>
			<Field.Label>Accept terms and conditions</Field.Label>
			<Field.Control render={ <Checkbox { ...args } /> } />
		</Field.Root>
	),
	args: {
		disabled: true,
	},
};

export const DisabledChecked: Story = {
	render: ( args ) => (
		<Field.Root>
			<Field.Label>Accept terms and conditions</Field.Label>
			<Field.Control render={ <Checkbox { ...args } /> } />
		</Field.Root>
	),
	args: {
		disabled: true,
		defaultChecked: true,
	},
};
