import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import { SearchInput } from '../index';
import * as Field from '../../field';
import { Text } from '../../../../text';
import { Stack } from '../../../../stack';

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
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of style consistency with `@wordpress/components`, overlays compatibility, and component set completeness. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135).',
		},
	},
};
export default meta;

type Story = StoryObj< typeof SearchInput >;

/**
 * The field is named "Search" by default. Pass an `aria-label` and a
 * `placeholder` that describe what is being searched.
 */
export const Default: Story = {
	args: {
		'aria-label': 'Search posts',
		placeholder: 'Search posts',
	},
};

/**
 * The reset button appears once the field has a value. It clears the field
 * and moves focus back to it.
 */
export const WithValue: Story = {
	args: {
		...Default.args,
		defaultValue: 'Pizza',
	},
};

export const Controlled: Story = {
	render: function Template( { onValueChange, ...args } ) {
		const [ value, setValue ] = useState( '' );

		return (
			<Stack direction="column" gap="sm">
				<SearchInput
					{ ...args }
					value={ value }
					onValueChange={ ( nextValue, eventDetails ) => {
						setValue( nextValue );
						onValueChange?.( nextValue, eventDetails );
					} }
				/>
				<Text>Query: { value }</Text>
			</Stack>
		);
	},
	args: {
		...Default.args,
	},
};

export const Compact: Story = {
	args: {
		...WithValue.args,
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
		placeholder: 'Font name…',
	},
};
