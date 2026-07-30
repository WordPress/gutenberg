import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { SearchableChipSelectControl } from '../';
import * as SearchableChipSelectStories from '../../primitives/searchable-chip-select/stories/index.story';

const meta: Meta< typeof SearchableChipSelectControl > = {
	title: 'Design System/Components/Form/SearchableChipSelectControl',
	component: SearchableChipSelectControl,
	subcomponents: {
		'SearchableChipSelectControl.Item': SearchableChipSelectControl.Item,
		'SearchableChipSelectControl.ChipWithRemove':
			SearchableChipSelectControl.ChipWithRemove,
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

type Story = StoryObj< typeof SearchableChipSelectControl >;

export const Default: Story = {
	...SearchableChipSelectStories.Default,
	args: {
		...SearchableChipSelectStories.Default.args,
		label: 'Label',
		description: 'This is a description.',
	},
};

export const Creatable: Story = {
	...SearchableChipSelectStories.Creatable,
	args: {
		...Default.args,
		...SearchableChipSelectStories.Creatable.args,
	},
};

export const WithCustomChipsAndItems: Story = {
	...SearchableChipSelectStories.WithCustomChipsAndItems,
	args: {
		...Default.args,
		...SearchableChipSelectStories.WithCustomChipsAndItems.args,
	},
};

export const WithCustomEmptyContent: Story = {
	...SearchableChipSelectStories.WithCustomEmptyContent,
	args: {
		...Default.args,
		...SearchableChipSelectStories.WithCustomEmptyContent.args,
	},
};

export const WithoutClearButton: Story = {
	...SearchableChipSelectStories.WithoutClearButton,
	args: {
		...Default.args,
		...SearchableChipSelectStories.WithoutClearButton.args,
	},
};
