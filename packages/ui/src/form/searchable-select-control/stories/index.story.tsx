import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { SearchableSelectControl } from '../';
import * as SearchableSelectStories from '../../primitives/searchable-select/stories/index.story';

const meta: Meta< typeof SearchableSelectControl > = {
	title: 'Design System/Components/Form/SearchableSelectControl',
	component: SearchableSelectControl,
	subcomponents: {
		'SearchableSelectControl.Item': SearchableSelectControl.Item,
	},
	argTypes: {
		items: { control: false },
		onValueChange: { action: fn() },
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

type Story = StoryObj< typeof SearchableSelectControl >;

const ITEMS_WITH_DISABLED = [
	{
		value: '1',
		label: 'Apple',
	},
	{
		value: '2',
		label: 'Banana',
		disabled: true,
	},
	{
		value: '3',
		label: 'Cherry',
	},
	{
		value: '4',
		label: 'Date',
	},
];

export const Default: Story = {
	...SearchableSelectStories.Default,
	args: {
		...SearchableSelectStories.Default.args,
		label: 'Label',
		description: 'This is a description.',
	},
};

export const WithDisabledOption: Story = {
	args: {
		...Default.args,
		items: ITEMS_WITH_DISABLED,
		defaultValue: ITEMS_WITH_DISABLED[ 0 ],
	},
};

export const Creatable: Story = {
	...SearchableSelectStories.Creatable,
	args: {
		...Default.args,
		...SearchableSelectStories.Creatable.args,
	},
};

export const WithCustomTriggerAndItems: Story = {
	...SearchableSelectStories.WithCustomTriggerAndItems,
	args: {
		...Default.args,
		...SearchableSelectStories.WithCustomTriggerAndItems.args,
	},
};

export const WithCustomEmptyContent: Story = {
	...SearchableSelectStories.WithCustomEmptyContent,
	args: {
		...Default.args,
		...SearchableSelectStories.WithCustomEmptyContent.args,
	},
};
