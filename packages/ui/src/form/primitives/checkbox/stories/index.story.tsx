import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from '../';
import * as Field from '../../field';
import { Stack } from '../../../../stack';

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

// Checkbox has no built-in label. `Field.Label` with `variant="plain"` is the
// labeling pattern this package documents for checkboxes and radios; the row
// layout puts the label beside the control rather than above it.
export const Default: Story = {
	render: ( args ) => (
		<Field.Root
			render={ <Stack direction="row" gap="sm" align="center" /> }
		>
			<Field.Control render={ <Checkbox { ...args } /> } />
			<Field.Label variant="plain">
				Accept terms and conditions
			</Field.Label>
		</Field.Root>
	),
	args: {},
};

export const Checked: Story = {
	render: ( args ) => (
		<Field.Root
			render={ <Stack direction="row" gap="sm" align="center" /> }
		>
			<Field.Control render={ <Checkbox { ...args } /> } />
			<Field.Label variant="plain">
				Accept terms and conditions
			</Field.Label>
		</Field.Root>
	),
	args: {
		defaultChecked: true,
	},
};

export const Indeterminate: Story = {
	render: ( args ) => (
		<Field.Root
			render={ <Stack direction="row" gap="sm" align="center" /> }
		>
			<Field.Control render={ <Checkbox { ...args } /> } />
			<Field.Label variant="plain">
				Accept terms and conditions
			</Field.Label>
		</Field.Root>
	),
	args: {
		indeterminate: true,
	},
};

export const Disabled: Story = {
	render: ( args ) => (
		<Field.Root
			render={ <Stack direction="row" gap="sm" align="center" /> }
		>
			<Field.Control render={ <Checkbox { ...args } /> } />
			<Field.Label variant="plain">
				Accept terms and conditions
			</Field.Label>
		</Field.Root>
	),
	args: {
		disabled: true,
	},
};

export const DisabledChecked: Story = {
	render: ( args ) => (
		<Field.Root
			render={ <Stack direction="row" gap="sm" align="center" /> }
		>
			<Field.Control render={ <Checkbox { ...args } /> } />
			<Field.Label variant="plain">
				Accept terms and conditions
			</Field.Label>
		</Field.Root>
	),
	args: {
		disabled: true,
		defaultChecked: true,
	},
};
