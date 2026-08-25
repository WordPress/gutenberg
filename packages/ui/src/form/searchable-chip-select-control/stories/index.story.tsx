import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import { fn } from 'storybook/test';
import { SearchableChipSelectControl } from '../';
import {
	GROUPED_ITEMS,
	type FixtureGroup,
	type FixtureItem,
} from '../../primitives/combobox/stories/fixtures';
import { ITEMS } from '../../primitives/searchable-chip-select/stories/fixtures';
import * as SearchableChipSelectStories from '../../primitives/searchable-chip-select/stories/index.story';
import {
	WITH_DETAILS_DESCRIPTION,
	DETAILS_EXAMPLE,
} from '../../stories/shared';

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

export const VisuallyHiddenLabel: Story = {
	args: {
		...Default.args,
		hideLabelFromVision: true,
	},
};

export const WithDetails: Story = {
	parameters: {
		docs: { description: { story: WITH_DETAILS_DESCRIPTION } },
	},
	args: {
		...Default.args,
		description: undefined,
		details: DETAILS_EXAMPLE,
	},
};

/**
 * Use the `searchPlaceholder` prop to customize the search input placeholder
 * text. Prefer a concise label without a trailing ellipsis.
 */
export const WithCustomSearchPlaceholder: Story = {
	args: {
		...Default.args,
		searchPlaceholder: 'Search fruit',
	},
};

const disabledOptionItems = [
	{
		value: 'apple',
		label: 'Apple',
	},
	{
		value: 'banana',
		label: 'Banana',
		disabled: true,
	},
	{
		value: 'cherry',
		label: 'Cherry',
	},
];

export const WithDisabledOption: Story = {
	args: {
		...Default.args,
		items: disabledOptionItems,
		defaultValue: [ disabledOptionItems[ 0 ] ],
	},
};

/**
 * Mark a creatable action with `creatable: true` on an item in `items`.
 * It renders in the list footer and is excluded from the main list
 * automatically. Handle creation in `onValueChange`.
 */
export const Creatable: Story = {
	args: {
		...Default.args,
	},
	render: function Template( args ) {
		const [ inputValue, setInputValue ] = useState( '' );
		const [ value, setValue ] = useState< typeof ITEMS >( [
			ITEMS[ 0 ],
			ITEMS[ 1 ],
		] );
		const creatableItem = {
			value: '__create__',
			label:
				'Create new item' + ( inputValue ? `: ${ inputValue }` : '' ),
			creatable: true,
		};

		return (
			<SearchableChipSelectControl
				{ ...args }
				items={ [ ...ITEMS, creatableItem ] }
				inputValue={ inputValue }
				onInputValueChange={ setInputValue }
				value={ value }
				onValueChange={ ( values: typeof ITEMS, event ) => {
					if (
						values.some(
							( item ) => item.value === creatableItem.value
						)
					) {
						// eslint-disable-next-line no-alert
						alert( `Create new item: '${ inputValue }'` );
						setValue(
							values.filter(
								( item ) => item.value !== creatableItem.value
							)
						);
					} else {
						setValue( values );
					}
					args.onValueChange?.( values, event );
				} }
			/>
		);
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
		...SearchableChipSelectStories.Grouped.args,
		defaultValue: [
			GROUPED_ITEMS[ 0 ].items[ 0 ],
			GROUPED_ITEMS[ 1 ].items[ 0 ],
		],
		label: 'Fruit',
		description: 'Choose your favorite fruits.',
	},
};

/**
 * Grouped items with a creatable footer item. Include the creatable item in
 * `items` as a creatable-only group and handle creation in `onValueChange`.
 */
export const GroupedCreatable: Story = {
	args: {
		...Default.args,
		label: 'Fruit',
		description: 'Choose your favorite fruits.',
	},
	render: function Template( args ) {
		const [ inputValue, setInputValue ] = useState( '' );
		const [ value, setValue ] = useState< FixtureItem[] >( [
			GROUPED_ITEMS[ 0 ].items[ 0 ],
			GROUPED_ITEMS[ 1 ].items[ 0 ],
		] );
		const creatableItem = {
			value: '__create__',
			label:
				'Create new item' + ( inputValue ? `: ${ inputValue }` : '' ),
			creatable: true,
		};
		const items = [
			...GROUPED_ITEMS,
			{ label: '', items: [ creatableItem ] },
		];

		return (
			<SearchableChipSelectControl
				{ ...args }
				items={ items }
				inputValue={ inputValue }
				onInputValueChange={ setInputValue }
				value={ value }
				onValueChange={ ( values: FixtureItem[], event ) => {
					if (
						values.some(
							( item ) => item.value === creatableItem.value
						)
					) {
						// eslint-disable-next-line no-alert
						alert( `Create new item: '${ inputValue }'` );
						setValue(
							values.filter(
								( item ) => item.value !== creatableItem.value
							)
						);
					} else {
						setValue( values );
					}
					args.onValueChange?.( values, event );
				} }
				children={ ( group: FixtureGroup ) => (
					<SearchableChipSelectControl.Group
						key={ group.label }
						items={ group.items }
					>
						<SearchableChipSelectControl.GroupLabel>
							{ group.label }
						</SearchableChipSelectControl.GroupLabel>
						<SearchableChipSelectControl.Collection>
							{ ( item: FixtureItem ) => (
								<SearchableChipSelectControl.Item
									key={ item.value }
									value={ item }
								>
									{ item.label }
								</SearchableChipSelectControl.Item>
							) }
						</SearchableChipSelectControl.Collection>
					</SearchableChipSelectControl.Group>
				) }
			/>
		);
	},
};
