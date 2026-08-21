import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { SearchableChipSelectControl } from '../';
import * as SearchableChipSelectStories from '../../primitives/searchable-chip-select/stories/index.story';

const meta: Meta< typeof SearchableChipSelectControl > = {
	tags: [ 'manifest' ],
	title: 'Design System/Components/Form/SearchableChipSelectControl',
	component: SearchableChipSelectControl,
	// Temporary: Due to an upstream bug, render the root explicitly so the
	// components manifest extractor can resolve props from the JSX.
	//
	// See: https://github.com/storybookjs/storybook/issues/34877
	render: ( args ) => <SearchableChipSelectControl { ...args } />,
	subcomponents: {
		'SearchableChipSelectControl.Group': SearchableChipSelectControl.Group,
		'SearchableChipSelectControl.GroupLabel':
			SearchableChipSelectControl.GroupLabel,
		'SearchableChipSelectControl.Item': SearchableChipSelectControl.Item,
		'SearchableChipSelectControl.ChipWithRemove':
			SearchableChipSelectControl.ChipWithRemove,
		'SearchableChipSelectControl.Collection':
			SearchableChipSelectControl.Collection,
	},
	argTypes: {
		items: { control: false },
		onValueChange: { action: fn() },
	},
	parameters: {
		componentStatus: {
			status: 'recommended',
			whereUsed: 'global',
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

/**
 * Options can be organized into labeled groups with
 * `SearchableChipSelectControl.Group`, `SearchableChipSelectControl.GroupLabel`,
 * and `SearchableChipSelectControl.Collection`. Pass an array of groups to
 * `items` (each with `label` and `items` properties), and use `children` to
 * render each group.
 */
export const Grouped: Story = {
	...SearchableChipSelectStories.Grouped,
	args: {
		...Default.args,
		...SearchableChipSelectStories.Grouped.args,
		label: 'Fruit',
		description: 'Choose your favorite fruits.',
	},
};
