import type { Meta, StoryObj } from '@storybook/react-vite';
import { SearchInput } from '../index';
import * as Field from '../../field';

const meta: Meta< typeof SearchInput > = {
	title: 'Components/@wordpress-ui/Form/Primitives/SearchInput',
	id: 'design-system-components-form-primitives-searchinput',
	component: SearchInput,
	argTypes: {
		defaultValue: { control: false },
		onValueChange: { action: 'onValueChange' },
		value: { control: false },
	},
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'APIs and behavior are still prone to change.',
		},
	},
};
export default meta;

type Story = StoryObj< typeof SearchInput >;

/**
 * The field is named "Search" by default. Pass an `aria-label` and a
 * `placeholder` that describe what is being searched.
 */
export const Default: Story = {};

/**
 * The clear button appears once the field has a value. It clears the field
 * and moves focus back to it.
 */
export const WithValue: Story = {
	args: {
		defaultValue: 'garden',
	},
};

export const Compact: Story = {
	args: {
		size: 'compact',
	},
};

/**
 * For a visible label, wrap the field in `Field.Root` with a `Field.Label`.
 * The label then names the field instead of `aria-label`.
 */
export const WithVisibleLabel: Story = {
	render: function Template( args ) {
		return (
			<Field.Root>
				<Field.Label>Search fonts</Field.Label>
				<SearchInput { ...args } />
			</Field.Root>
		);
	},
	args: {
		placeholder: 'Font name',
	},
};
